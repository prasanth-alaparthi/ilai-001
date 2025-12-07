import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from 'prosemirror-state';

export const FileDropExtension = Extension.create({
  name: 'fileDrop',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('fileDrop'),
        props: {
          handleDrop(view, event, slice, moved) {
            if (moved) {
              return false;
            }
            if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
              const files = Array.from(event.dataTransfer.files);
              const { schema } = view.state;
              const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });

              files.forEach(file => {
                const reader = new FileReader();
                reader.onload = (e) => {
                  const { tr } = view.state;
                  const node = schema.nodes.image.create({ src: e.target.result });
                  const transaction = tr.insert(pos.pos, node);
                  view.dispatch(transaction);
                };
                reader.readAsDataURL(file);
              });

              return true;
            }
            return false;
          },
        },
      }),
    ];
  },
});
