import {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';

import invariant from 'tiny-invariant';

import Button from '@atlaskit/button/new';

import {TreeContext} from './context';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle, DialogTrigger
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
import {Input} from "@/components/ui/input";

type FormValues = {
  label: string;
  parent: string;
  position: string;
};

const AddNewDialog = () => {
  const [open, setOpen] = useState(false);
  const {dispatch, getChildrenOfItem, getMoveTargets} = useContext(TreeContext);
  const formRef = useRef<HTMLFormElement>(null);
  const form = useForm<FormValues>({
    defaultValues: { parent: "NONE", position: "1", label: "" },
  });
  const itemId = crypto.randomUUID();

  const options = useMemo(() => {
    const targets = getMoveTargets({itemId});

    const targetOptions = targets.map((item) => {
      return {label: `Item ${item.id}`, value: item.id};
    });

    return [{label: 'No parent', value: "NONE"}, ...targetOptions];
  }, [getMoveTargets, itemId]);

  const [parentId, setParentId] = useState("");
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
        type: 'modal-add',
        itemId,
        item: {
          label: data.label,
          id: itemId,
          children: [],
        },
        targetId: data.parent === "NONE" ? "" : data.parent,
        /**
         * Subtract one to convert the position back to an index
         */
        index: Number(data.position) - 1,
      });
      setOpen(false);
    },
    [dispatch, itemId],
  );

  useEffect(() => {
    form.setValue('position', `${positionOptions[0]?.value || 1}`)
  }, [positionOptions]);

  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add New</Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Add</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Label</FormLabel>
                  <FormControl>
                    <Input placeholder="Node Name" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="parent"
              render={({field}) => (
                <FormItem>
                  <FormLabel>Parent</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      invariant(value !== null);
                      setParentId(value === "NONE" ? "" : value);
                      field.onChange(value);
                    }}
                    defaultValue={options[0].value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue/>
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
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
                        <SelectValue placeholder="Select a verified email to display" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {positionOptions.map((option) => (
                        <SelectItem key={option.value} value={`${option.value}`}>{option.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="button" appearance="subtle" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default AddNewDialog;
