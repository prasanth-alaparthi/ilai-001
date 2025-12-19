import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { Search, FileText } from 'lucide-react';

export default forwardRef((props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index) => {
        const item = props.items[index];

        if (item) {
            props.command(item);
        }
    };

    const upHandler = () => {
        setSelectedIndex(((selectedIndex + props.items.length) - 1) % props.items.length);
    };

    const downHandler = () => {
        setSelectedIndex((selectedIndex + 1) % props.items.length);
    };

    const enterHandler = () => {
        selectItem(selectedIndex);
    };

    useEffect(() => setSelectedIndex(0), [props.items]);

    useImperativeHandle(ref, () => ({
        onKeyDown: ({ event }) => {
            if (event.key === 'ArrowUp') {
                upHandler();
                return true;
            }

            if (event.key === 'ArrowDown') {
                downHandler();
                return true;
            }

            if (event.key === 'Enter') {
                enterHandler();
                return true;
            }

            return false;
        },
    }));

    return (
        <div className="bg-surface-800/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[300px] animate-in fade-in zoom-in duration-200">
            <div className="p-2 border-b border-white/5 bg-white/5 flex items-center gap-2">
                <Search className="w-4 h-4 text-surface-400" />
                <span className="text-xs font-medium text-surface-400 uppercase tracking-wider">Link to Note</span>
            </div>
            <div className="p-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                {props.items.length > 0 ? (
                    props.items.map((item, index) => (
                        <button
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-lg transition-all duration-200 ${index === selectedIndex
                                    ? 'bg-primary-500/20 text-primary-200 ring-1 ring-primary-500/50'
                                    : 'text-surface-300 hover:bg-white/5'
                                }`}
                            key={index}
                            onClick={() => selectItem(index)}
                        >
                            <div className={`p-1.5 rounded-md ${index === selectedIndex ? 'bg-primary-500/30' : 'bg-white/5'}`}>
                                <FileText className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium leading-tight">{item.title}</span>
                                {item.sectionTitle && (
                                    <span className="text-[10px] text-surface-500 leading-tight mt-0.5">
                                        in {item.sectionTitle}
                                    </span>
                                )}
                            </div>
                        </button>
                    ))
                ) : (
                    <div className="px-3 py-4 text-center text-sm text-surface-500">
                        No notes found
                    </div>
                )}
            </div>
        </div>
    );
});
