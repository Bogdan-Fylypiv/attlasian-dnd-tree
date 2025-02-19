import { Fragment, memo, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { createRoot } from 'react-dom/client';
import invariant from 'tiny-invariant';

import {Button} from "../ui/button";
import FocusRing from '@atlaskit/focus-ring';
import ChevronDownIcon from '@atlaskit/icon/utility/migration/chevron-down';
import ChevronRightIcon from '@atlaskit/icon/utility/migration/chevron-right';
import {
  type Instruction,
  type ItemMode,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/tree-item';
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine';
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import type { DragLocationHistory } from '@atlaskit/pragmatic-drag-and-drop/types';
import classes from "./treeItem.module.css"
import { token } from '@atlaskit/tokens';

import { type TreeItem as TreeItemType } from './data';

import { indentPerLevel } from './constants';
import { DependencyContext, TreeContext } from './context';
import {
  DropdownMenu,
  DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import MoveDialog from "@/components/Tree/moveDialog";
import EditDialog from "@/components/Tree/editDialog";
import {cn} from "@/lib/utils.ts";

const iconColor = token('color.icon', '#44546F');

function GroupIcon({ isOpen }: { isOpen: boolean }) {
  const Icon = isOpen ? ChevronDownIcon : ChevronRightIcon;
  return <Icon spacing="spacious" label="" color={iconColor} />;
}

function Icon({ item }: { item: TreeItemType }) {
  if (!item.children.length) {
    return;
  }
  return <GroupIcon isOpen={item.isOpen ?? false} />;
}

function Preview({ item }: { item: TreeItemType }) {
  return <div className={classes.preview}>{item.label}</div>;
}

function getParentLevelOfInstruction(instruction: Instruction): number {
  if (instruction.type === 'instruction-blocked') {
    return getParentLevelOfInstruction(instruction.desired);
  }
  if (instruction.type === 'reparent') {
    return instruction.desiredLevel - 1;
  }
  return instruction.currentLevel - 1;
}

function delay({ waitMs: timeMs, fn }: { waitMs: number; fn: () => void }): () => void {
  let timeoutId: number | null = window.setTimeout(() => {
    timeoutId = null;
    fn();
  }, timeMs);
  return function cancel() {
    if (timeoutId) {
      window.clearTimeout(timeoutId);
      timeoutId = null;
    }
  };
}

const TreeItem = memo(function TreeItem({
                                          item,
                                          mode,
                                          level,
                                          index,
                                        }: {
  item: TreeItemType;
  mode: ItemMode;
  level: number;
  index: number;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [state, setState] = useState<'idle' | 'dragging' | 'preview' | 'parent-of-instruction'>(
    'idle',
  );
  const [instruction, setInstruction] = useState<Instruction | null>(null);
  const cancelExpandRef = useRef<(() => void) | null>(null);

  const { dispatch, uniqueContextId, getPathToItem, registerTreeItem } = useContext(TreeContext);
  const { DropIndicator, attachInstruction, extractInstruction } = useContext(DependencyContext);
  const toggleOpen = useCallback(() => {
    dispatch({ type: 'toggle', itemId: item.id });
  }, [dispatch, item]);

  const actionMenuTriggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    invariant(buttonRef.current);
    invariant(actionMenuTriggerRef.current);
    return registerTreeItem({
      itemId: item.id,
      element: buttonRef.current,
      actionMenuTrigger: actionMenuTriggerRef.current,
    });
  }, [item.id, registerTreeItem]);

  const cancelExpand = useCallback(() => {
    cancelExpandRef.current?.();
    cancelExpandRef.current = null;
  }, []);

  const clearParentOfInstructionState = useCallback(() => {
    setState((current) => (current === 'parent-of-instruction' ? 'idle' : current));
  }, []);

  // When an item has an instruction applied
  // we are highlighting it's parent item for improved clarity
  const shouldHighlightParent = useCallback(
    (location: DragLocationHistory): boolean => {
      const target = location.current.dropTargets[0];

      if (!target) {
        return false;
      }

      const instruction = extractInstruction(target.data);

      if (!instruction) {
        return false;
      }

      const targetId = target.data.id;
      invariant(typeof targetId === 'string');

      const path = getPathToItem(targetId);
      const parentLevel: number = getParentLevelOfInstruction(instruction);
      const parentId = path[parentLevel];
      return parentId === item.id;
    },
    [getPathToItem, extractInstruction, item],
  );

  useEffect(() => {
    invariant(buttonRef.current);

    function updateIsParentOfInstruction({ location }: { location: DragLocationHistory }) {
      if (shouldHighlightParent(location)) {
        setState('parent-of-instruction');
        return;
      }
      clearParentOfInstructionState();
    }

    return combine(
      draggable({
        element: buttonRef.current,
        getInitialData: () => ({
          id: item.id,
          type: 'tree-item',
          isOpenOnDragStart: item.isOpen,
          uniqueContextId,
        }),
        onGenerateDragPreview: ({ nativeSetDragImage }) => {
          setCustomNativeDragPreview({
            getOffset: pointerOutsideOfPreview({ x: '16px', y: '8px' }),
            render: ({ container }) => {
              const root = createRoot(container);
              root.render(<Preview item={item} />);
              return () => root.unmount();
            },
            nativeSetDragImage,
          });
        },
        onDragStart: ({ source }) => {
          setState('dragging');
          // collapse open items during a drag
          if (source.data.isOpenOnDragStart) {
            dispatch({ type: 'collapse', itemId: item.id });
          }
        },
        onDrop: ({ source }) => {
          setState('idle');
          if (source.data.isOpenOnDragStart) {
            dispatch({ type: 'expand', itemId: item.id });
          }
        },
      }),
      dropTargetForElements({
        element: buttonRef.current,
        getData: ({ input, element }) => {
          const data = { id: item.id };

          return attachInstruction(data, {
            input,
            element,
            indentPerLevel,
            currentLevel: level,
            mode,
            block: [],
          });
        },
        canDrop: ({ source }) =>
          source.data.type === 'tree-item' && source.data.uniqueContextId === uniqueContextId,
        getIsSticky: () => true,
        onDrag: ({ self, source }) => {
          const instruction = extractInstruction(self.data);

          if (source.data.id !== item.id) {
            // expand after 500ms if still merging
            if (
              instruction?.type === 'make-child' &&
              item.children.length &&
              !item.isOpen &&
              !cancelExpandRef.current
            ) {
              cancelExpandRef.current = delay({
                waitMs: 500,
                fn: () => dispatch({ type: 'expand', itemId: item.id }),
              });
            }
            if (instruction?.type !== 'make-child' && cancelExpandRef.current) {
              cancelExpand();
            }

            setInstruction(instruction);
            return;
          }
          if (instruction?.type === 'reparent') {
            setInstruction(instruction);
            return;
          }
          setInstruction(null);
        },
        onDragLeave: () => {
          cancelExpand();
          setInstruction(null);
        },
        onDrop: () => {
          cancelExpand();
          setInstruction(null);
        },
      }),
      monitorForElements({
        canMonitor: ({ source }) => source.data.uniqueContextId === uniqueContextId,
        onDragStart: updateIsParentOfInstruction,
        onDrag: updateIsParentOfInstruction,
        onDrop() {
          clearParentOfInstructionState();
        },
      }),
    );
  }, [
    dispatch,
    item,
    mode,
    level,
    cancelExpand,
    uniqueContextId,
    extractInstruction,
    attachInstruction,
    getPathToItem,
    clearParentOfInstructionState,
    shouldHighlightParent,
  ]);

  useEffect(
    function mount() {
      return function unmount() {
        cancelExpand();
      };
    },
    [cancelExpand],
  );

  const aria = (() => {
    if (!item.children.length) {
      return undefined;
    }
    return {
      'aria-expanded': item.isOpen,
      'aria-controls': `tree-item-${item.id}--subtree`,
    };
  })();

  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const openMoveDialog = useCallback(() => {
    setIsMoveDialogOpen(true);
  }, []);
  const closeMoveDialog = useCallback(() => {
    setIsMoveDialogOpen(false);
  }, []);
  const openEditDialog = useCallback(() => {
    setIsEditDialogOpen(true);
  }, []);
  const closeEditDialog = useCallback(() => {
    setIsEditDialogOpen(false);
  }, []);

  const onNodeRemoving = useCallback(() => {
    if (window.confirm(`Are you sure you want to remove "${item.label}"?`)) {
      dispatch({ type: 'node-remove', itemId: item.id })
    }
  }, [item]);

  return (
    <Fragment>
      <div className={state === 'idle' ? classes.rootIdle : classes.root}>
        <FocusRing isInset>
          <button
            {...aria}
            style={{
              color: token('color.text', 'currentColor'),

              border: 0,
              width: '100%',
              position: 'relative',
              background: 'transparent',
              margin: 0,
              padding: 0,
              borderRadius: 3,
              cursor: 'pointer',
              paddingLeft: level * indentPerLevel
            }}
            id={`tree-item-${item.id}`}
            onClick={toggleOpen}
            ref={buttonRef}
            type="button"
            data-index={index}
            data-level={level}
            data-testid={`tree-item-${item.id}`}
          >
						<span
              className={classes.button}
              style={{
                ...{
                  padding: '16px',
                  paddingRight: 40,
                  alignItems: 'center',
                  display: 'flex',
                  gap: 8,
                  flexDirection: 'row',

                  // background: token('color.background.neutral.subtle', 'transparent'),
                  borderRadius: 3,
                },
                ...(state === 'dragging'
                  ? {opacity: 0.4}
                  : state === 'parent-of-instruction'
                    ? {background: token('color.background.selected.hovered', 'transparent')}
                    : {}),
              }}
            >
							<Icon item={item}/>
              <span className={cn(classes.indicator, `bg-${item.color}-500`)}/>
							<span style={{
                flexGrow: 1,
                overflow: 'hidden',
                textAlign: 'left',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>{item.label}</span>
						</span>
            {instruction ? <DropIndicator instruction={instruction} /> : null}
          </button>
        </FocusRing>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              className="w-5 h-5"
              ref={actionMenuTriggerRef}
              variant="outline"
              size="icon"
              style={{ position: 'absolute', top: "50%", right: 8, transform: "translateY(-50%)" }}
            >
              ⋮
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={openEditDialog}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={openMoveDialog}>
              Move
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onNodeRemoving}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {item.children.length && item.isOpen ? (
        <div id={aria?.['aria-controls']} className="flex flex-col gap-[8px]">
          {item.children.map((child, index, array) => {
            const childType: ItemMode = (() => {
              if (child.children.length && child.isOpen) {
                return 'expanded';
              }

              if (index === array.length - 1) {
                return 'last-in-group';
              }

              return 'standard';
            })();
            return (
              <TreeItem
                item={child}
                key={child.id}
                level={level + 1}
                mode={childType}
                index={index}
              />
            );
          })}
        </div>
      ) : null}
      {isMoveDialogOpen && <MoveDialog onClose={closeMoveDialog} itemId={item.id} />}
      {isEditDialogOpen && <EditDialog onClose={closeEditDialog} item={item} />}
    </Fragment>
  );
});

export default TreeItem;
