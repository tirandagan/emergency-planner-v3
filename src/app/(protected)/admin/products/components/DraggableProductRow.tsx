import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ProductRow, type ProductRowProps } from './ProductRow';

/**
 * DraggableProductRow - Adds drag-and-drop functionality to product rows
 *
 * Passes drag-and-drop props to ProductRow which applies them to the <tr> element.
 * This avoids wrapping the <tr> in a <div> which would break HTML table structure.
 * Uses @dnd-kit/sortable for accessible, keyboard-navigable drag-and-drop.
 *
 * @param props - All ProductRow props
 * @returns ProductRow with drag-and-drop capabilities
 */
export function DraggableProductRow(props: ProductRowProps): React.JSX.Element {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: props.product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <ProductRow
      {...props}
      dragRef={setNodeRef}
      dragStyle={style}
      dragAttributes={attributes}
      dragListeners={listeners}
      isDraggingState={isDragging}
    />
  );
}
