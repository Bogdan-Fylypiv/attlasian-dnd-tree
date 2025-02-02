import {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';

import invariant from 'tiny-invariant';

import {TreeContext} from './context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {useForm} from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {Button} from "@/components/ui/button.tsx";

type FormValues = {
  parent: string;
  position: string;
  label: string;
};

const MoveDialog = ({onClose, itemId}: { onClose: () => void; itemId: string }) => {
  const {dispatch, getChildrenOfItem, getMoveTargets, getPathToItem} = useContext(TreeContext);
  const formRef = useRef<HTMLFormElement>(null);
  const form = useForm<FormValues>({
    defaultValues: { parent: "NONE", position: "1" },
  });

  const options = useMemo(() => {
    const targets = getMoveTargets({itemId});

    const targetOptions = targets.map((item) => {
      return {label: item.label, value: item.id};
    });

    return [{label: 'No parent', value: 'NONE'}, ...targetOptions];
  }, [getMoveTargets, itemId]);

  const defaultParent: { label: string; value: string } = useMemo(() => {
    const path = getPathToItem(itemId);
    const parentId = path[path.length - 1] ?? "NONE";
    const option = options.find((option) => option.value === parentId);
    invariant(option);
    return option;
  }, [getPathToItem, itemId, options]);

  const [parentId, setParentId] = useState(defaultParent.value === "NONE" ? "" : defaultParent.value);
  const positionOptions = useMemo(() => {
    const targets = getChildrenOfItem(parentId).filter((item) => item.id !== itemId);

    return Array.from({length: targets.length + 1}, (_, index) => {
      /**
       * Adding one to convert index to positions
       */
      return {label: String(index + 1), value: index + 1};
    });
  }, [getChildrenOfItem, itemId, parentId]);

  const onSubmit = useCallback(
    (data: FormValues) => {
      console.log('formData = ', data);
      dispatch({
        type: 'modal-move',
        itemId,
        targetId: data.parent === "NONE" ? "" : data.parent,
        /**
         * Subtract one to convert the position back to an index
         */
        index: Number(data.position) - 1,
      });
      onClose();
    },
    [dispatch, itemId],
  );

  useEffect(() => {
    form.setValue('parent', parentId);
    form.setValue('position', `${positionOptions[0].value}`);
  }, []);

  return (
    <Dialog defaultOpen onOpenChange={(open) => !open && onClose()} aria-hidden="undefined">
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Move</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="parent"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Parent</FormLabel>
                  <Select
                    value={form.getValues().parent === "" ? "NONE" : form.getValues().parent}
                    onValueChange={(value) => {
                      invariant(value !== null);
                      setParentId(value === "NONE" ? "" : value);
                      field.onChange(value);
                    }}
                    defaultValue={defaultParent.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue/>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {options.map((option) => (
                        <SelectItem key={option.value} value={option.value || "NONE"}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="position"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <Select
                    value={form.getValues().position}
                    onValueChange={field.onChange}
                    defaultValue={`${positionOptions[0].value}`}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue/>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {positionOptions.map((option) => (
                        <SelectItem key={option.value} value={`${option.value}`}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage/>
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-4">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Submit</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default MoveDialog;
