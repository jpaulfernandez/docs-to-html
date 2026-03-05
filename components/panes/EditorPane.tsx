/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useAppStore } from "@/lib/store";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect } from "react";

function BlockFieldEditor({ block }: { block: any }) {
    const { updateBlock, updateBlockType } = useAppStore();

    const handleChange = (key: string, value: any) => {
        updateBlock(block.id, { [key]: value });
    };

    const handleTypeChange = (newType: string) => {
        updateBlockType(block.id, newType);

        const updates: any = {};
        if (newType === 'pullquote' && !block.fields.alignment) {
            updates.alignment = 'Center';
        }
        if ((newType === 'inline-image' || newType === 'parallax') && !block.fields.size) {
            updates.size = newType === 'parallax' ? 'Parallax' : 'Inline';
        }
        if (Object.keys(updates).length > 0) {
            updateBlock(block.id, updates);
        }
    };

    const adjustHeight = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        e.target.style.height = 'inherit';
        e.target.style.height = `${e.target.scrollHeight}px`;
    };

    const displayFields = { ...block.fields };
    if (block.type === 'pullquote' && displayFields.alignment === undefined) {
        displayFields.alignment = 'Center';
    }
    if ((block.type === 'inline-image' || block.type === 'parallax') && displayFields.size === undefined) {
        displayFields.size = block.type === 'parallax' ? 'Parallax' : 'Inline';
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-1.5 focus-within:text-orange-courage transition-colors border-b border-ash/20 pb-4 mb-4">
                <label className="text-[10px] font-bold uppercase text-system-gray tracking-wider">Block Type</label>
                <select
                    value={block.type}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="w-full text-sm font-sans p-2.5 border border-ash/80 rounded-lg bg-ghost font-bold text-navy focus:bg-white focus:border-orange-courage focus:ring-1 focus:ring-orange-courage outline-none transition-all"
                >
                    <option value="hero">Hero</option>
                    <option value="intro">Intro</option>
                    <option value="text">Text / Paragraph</option>
                    <option value="pullquote">Pullquote</option>
                    <option value="parallax">Parallax</option>
                    <option value="inline-image">Inline Image</option>
                    <option value="embed">Embed</option>
                    <option value="stat-block">Stat Block</option>
                    <option value="summary-box">Summary Box</option>
                    <option value="footnotes">Footnotes</option>
                </select>
            </div>

            {Object.entries(displayFields).map(([key, val]) => {
                if (typeof val === 'string' || val === null || val === undefined) {
                    const strVal = val || '';
                    const isTextarea = key === 'text' || key === 'bodyHtml' || key === 'embedCode';
                    return (
                        <div key={key} className="flex flex-col gap-1.5 focus-within:text-orange-courage transition-colors">
                            <label className="text-[10px] font-bold uppercase text-system-gray tracking-wider inherit-text">{key}</label>
                            {isTextarea ? (
                                <textarea
                                    value={strVal}
                                    onChange={(e) => {
                                        handleChange(key, e.target.value);
                                        adjustHeight(e);
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.height = 'inherit';
                                        e.target.style.height = `${e.target.scrollHeight}px`;
                                    }}
                                    className="w-full text-sm font-sans p-2.5 border border-ash/80 rounded-lg bg-ghost focus:bg-white focus:border-orange-courage focus:ring-1 focus:ring-orange-courage outline-none transition-all min-h-[120px] text-navy resize-none overflow-hidden"
                                />
                            ) : key === 'alignment' ? (
                                <select
                                    value={strVal}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    className="w-full text-sm font-sans p-2.5 border border-ash/80 rounded-lg bg-ghost focus:bg-white focus:border-orange-courage focus:ring-1 focus:ring-orange-courage outline-none transition-all text-navy"
                                >
                                    <option value="Left">Left</option>
                                    <option value="Center">Center</option>
                                    <option value="Right">Right</option>
                                    <option value="">(Default)</option>
                                </select>
                            ) : key === 'size' ? (
                                <select
                                    value={strVal}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    className="w-full text-sm font-sans p-2.5 border border-ash/80 rounded-lg bg-ghost focus:bg-white focus:border-orange-courage focus:ring-1 focus:ring-orange-courage outline-none transition-all text-navy"
                                >
                                    <option value="Inline">Inline</option>
                                    <option value="Full">Full</option>
                                    <option value="Parallax">Parallax</option>
                                </select>
                            ) : (
                                <input
                                    type="text"
                                    value={strVal}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    className="w-full text-sm font-sans p-2.5 border border-ash/80 rounded-lg bg-ghost focus:bg-white focus:border-orange-courage focus:ring-1 focus:ring-orange-courage outline-none transition-all text-navy"
                                />
                            )}
                        </div>
                    );
                }
                if (Array.isArray(val)) {
                    return (
                        <div key={key} className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold uppercase text-system-gray tracking-wider">{key}</label>
                            <div className="text-xs text-system-gray bg-ghost p-3 rounded-lg border border-ash/80 font-mono">
                                [Array Data: {val.length} items] - Advanced editing coming soon
                            </div>
                        </div>
                    );
                }
                return null;
            })}
        </div>
    );
}

function SortableBlockItem({ block }: { block: any }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: block.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        zIndex: isDragging ? 50 : 1,
    };

    return (
        <div
            id={`editor-block-${block.id}`}
            ref={setNodeRef}
            style={style}
            className={`group relative bg-white rounded-xl shadow-sm border ${isDragging ? "border-orange-courage scale-[1.02] shadow-md" : "border-ash/60"} hover:border-orange-courage/40 transition-all duration-300 overflow-hidden flex flex-col`}
        >
            <div
                {...attributes}
                {...listeners}
                className="bg-vanilla/10 px-4 py-3 border-b border-ash/40 flex items-center justify-between cursor-grab active:cursor-grabbing"
            >
                <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-system-gray/40 group-hover:text-orange-courage transition-colors" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM8 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM14 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM14 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0zM14 18a2 2 0 1 1-4 0 2 2 0 0 1 4 0z" />
                    </svg>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-courage/80"></div>
                        <span className="text-xs font-bold uppercase tracking-widest text-navy">{block.type as string}</span>
                    </div>
                </div>
                <button
                    className="text-system-gray/50 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors relative z-10"
                    title="Remove Block"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => alert('Delete stub ' + block.id)}
                >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            <div className="p-5 bg-white">
                <BlockFieldEditor block={block} />
            </div>
        </div>
    );
}

export default function EditorPane() {
    const { preflight, reorderBlocks } = useAppStore();
    const blocks = preflight?.blocks || [];

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const oldIndex = blocks.findIndex((b) => b.id === active.id);
            const newIndex = blocks.findIndex((b) => b.id === over.id);
            reorderBlocks(oldIndex, newIndex);
        }
    }

    // Bidirectional Click-to-Edit Message Receiver
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'BLOCK_CLICKED' && event.data?.id) {
                const blockCard = document.getElementById(`editor-block-${event.data.id}`);
                if (blockCard) {
                    blockCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Optional: highlight briefly
                    blockCard.classList.add('ring-4', 'ring-orange-courage', 'ring-opacity-50', 'scale-[1.02]', 'shadow-xl');
                    setTimeout(() => {
                        blockCard.classList.remove('ring-4', 'ring-orange-courage', 'ring-opacity-50', 'scale-[1.02]', 'shadow-xl');
                    }, 1200);
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return (
        <div className="p-8 pb-32 max-w-3xl mx-auto space-y-6">
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-ghost/90 backdrop-blur-md pt-4 pb-4 z-10 border-b border-ash/50">
                <h2 className="text-2xl font-bold font-serif text-navy">Document Blocks</h2>
                <span className="text-xs bg-white border border-ash text-system-gray px-3 py-1 rounded-full font-sans font-medium shadow-sm">
                    {blocks.length} items
                </span>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={blocks.map((b) => b.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-4">
                        {blocks.map((block) => (
                            <SortableBlockItem key={block.id} block={block} />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>
        </div>
    );
}
