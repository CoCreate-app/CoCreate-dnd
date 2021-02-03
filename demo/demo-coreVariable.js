     dom.element([{
            selector: '[data-group_name]',
            droppable: 'true',
            // idGenerator: () => UUID(12),
          },
          {
            selector: '.cloneable>*',
            cloneable: 'true',
            // idGenerator: () => UUID(12),
          },
          {
            selector: '.sortable> *',
            draggable: 'true',
            // idGenerator: () => UUID(12),
          }])
