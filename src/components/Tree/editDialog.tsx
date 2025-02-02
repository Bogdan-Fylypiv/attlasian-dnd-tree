import {useCallback, useContext, useMemo, useRef} from 'react';

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
import {TreeItem} from "@/components/Tree/data.ts";
import {Input} from "@/components/ui/input.tsx";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group.tsx";
import {colorClassMap} from "@/components/Tree/constants.ts";
import {cn} from "@/lib/utils.ts";
import classes from "@/components/Tree/form.module.css";
import invariant from "tiny-invariant";
import {Button} from "@/components/ui/button.tsx";

type FormValues = {
  label: string;
  color: string;
};

const EditDialog = ({onClose, item}: { onClose: () => void; item: TreeItem }) => {
  const {dispatch, getMoveTargets, getPathToItem} = useContext(TreeContext);
  const formRef = useRef<HTMLFormElement>(null);
  const form = useForm<FormValues>({
    defaultValues: { label: item.label, color: item.color },
  });
  
  const itemId = item.id;

  const options = useMemo(() => {
    const targets = getMoveTargets({itemId});

    const targetOptions = targets.map((item) => {
      return {label: item.label, value: item.id};
    });

    return [{label: 'No parent', value: ''}, ...targetOptions];
  }, [getMoveTargets, itemId]);

  const defaultParent: { label: string; value: string } = useMemo(() => {
    const path = getPathToItem(itemId);
    const parentId = path[path.length - 1] ?? "";
    const option = options.find((option) => option.value === parentId);
    invariant(option);
    return option;
  }, [getPathToItem, itemId, options]);

  const onSubmit = useCallback(
    (data: FormValues) => {
      console.log('formData = ', data);
      dispatch({
        type: 'modal-edit',
        itemId,
        targetId: defaultParent.value,
        item: {
          ...item,
          label: data.label,
          color: data.color,
        }
      });
      onClose();
    },
    [dispatch, item],
  );

  return (
    <Dialog defaultOpen onOpenChange={(open) => !open && onClose()} aria-hidden="undefined">
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Edit</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="label"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Button Name</FormLabel>
                  <FormControl>
                    <Input required placeholder="Enter button name" {...field} value={field.value || ''}/>
                  </FormControl>
                  <FormMessage/>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="color"
              render={({field}) => (
                <FormItem className="space-y-3">
                  <FormLabel>Select Button Color</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={Object.keys(colorClassMap)[0]}
                      className="mt-2 grid grid-cols-4 gap-2"
                    >
                      {Object.keys(colorClassMap).map((color) => (
                        <FormItem key={color}>
                          <FormControl>
                            <RadioGroupItem value={color} className={cn(classes.colorButton, `bg-${color}-500`)}/>
                          </FormControl>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage/>
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-4">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Edit</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default EditDialog;
