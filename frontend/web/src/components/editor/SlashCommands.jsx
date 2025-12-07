import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';

const SlashCommands = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index) => {
    const item = props.items[index];

    if (item) {
      props.command(item);
    }
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [props.items]);

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

  const upHandler = () => {
    setSelectedIndex(
      (selectedIndex + props.items.length - 1) % props.items.length
    );
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  return (
    <div className="bg-white dark:bg-surface-800 rounded-lg shadow-xl border border-surface-200 dark:border-surface-700 overflow-hidden min-w-[200px] p-1">
      {props.items.length ? (
        props.items.map((item, index) => (
          <button
            className={`flex items-center gap-2 w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${index === selectedIndex
                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700'
              }`}
            key={index}
            onClick={() => selectItem(index)}
          >
            {item.icon && <item.icon className="w-4 h-4" />}
            <span>{item.title}</span>
          </button>
        ))
      ) : (
        <div className="px-3 py-2 text-sm text-surface-500">
          No results
        </div>
      )}
    </div>
  );
});

SlashCommands.displayName = 'SlashCommands';

export default SlashCommands;
