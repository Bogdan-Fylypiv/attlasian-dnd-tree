import {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';

import invariant from 'tiny-invariant';

import {TreeContext} from './context';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet.tsx";
import {RadioGroup, RadioGroupItem} from "@/components/ui/radio-group.tsx";
import {colorClassMap} from "@/components/Tree/constants.ts";
import { cn } from "@/lib/utils"
import classes from "./form.module.css";
import {Button} from "@/components/ui/button.tsx";

type FormValues = {
  label: string;
  parent: string;
  position: string;
  color: string;
};

const AddNewDialog = () => {
  const [open, setOpen] = useState(false);
  const {dispatch, getChildrenOfItem, getMoveTargets} = useContext(TreeContext);
  const formRef = useRef<HTMLFormElement>(null);
  const form = useForm<FormValues>({
    defaultValues: {parent: "NONE", position: "1", label: "", color: Object.keys(colorClassMap)[0]},
  });
  const itemId = crypto.randomUUID();

  const options = useMemo(() => {
    const targets = getMoveTargets({itemId});

    const targetOptions = targets.map((item) => {
      return {label: item.label, value: item.id};
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
          color: data.color,
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
    if (!open) {
      form.reset();
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm">Add New Node</Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader className="mb-4">
          <SheetTitle>Add New Button Action</SheetTitle>
          <SheetDescription>
            Create a new button action by filling out this form. Click add when you're done.
          </SheetDescription>
        </SheetHeader>
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
              render={({ field }) => (
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
                            <RadioGroupItem value={color} className={cn(classes.colorButton, `bg-${color}-500`)} />
                          </FormControl>
                        </FormItem>
                      ))}
                    </RadioGroup>
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
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Submit</Button>
            </div>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}

export default AddNewDialog;
