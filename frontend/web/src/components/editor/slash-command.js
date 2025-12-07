import { ReactRenderer } from '@tiptap/react';
import tippy from 'tippy.js';
import SlashCommands from './SlashCommands';

const slashCommand = () => {
  let component;
  let popup;

  return {
    onStart: (props) => {
      component = new ReactRenderer(SlashCommands, {
        editor: props.editor,
        props,
      });

      if (!props.clientRect) {
        return;
      }

      popup = tippy('body', {
        getReferenceClientRect: props.clientRect,
        appendTo: () => document.body,
        content: component.element,
        showOnCreate: true,
        interactive: true,
        trigger: 'manual',
        placement: 'bottom-start',
      });
    },

    onUpdate(props) {
      if (component) {
        component.updateProps(props);
      }

      if (popup && popup[0]) {
        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      }
    },

    onKeyDown({ event }) {
      if (event.key === 'Escape') {
        if (popup && popup[0]) {
          popup[0].hide();
        }
        return true;
      }
      return component?.ref?.onKeyDown({ event });
    },

    onExit() {
      if (popup && popup[0]) {
        popup[0].destroy();
      }
      if (component) {
        component.destroy();
      }
    },
  };
};

export default slashCommand;
