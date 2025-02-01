import {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';

import invariant from 'tiny-invariant';

import Button from '@atlaskit/button/new';

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

type FormValues = {
  parent: string;
  position: number;
};

const ActionsDialog = ({onClose, itemId}: { onClose: () => void; itemId: string }) => {
  const {dispatch, getChildrenOfItem, getMoveTargets, getPathToItem} = useContext(TreeContext);
  const formRef = useRef<HTMLFormElement>(null);
  const form = useForm<FormValues>({
    defaultValues: { parent: "", position: 1 },
  });

  const options = useMemo(() => {
    console.log("options update");
    const targets = getMoveTargets({itemId});

    const targetOptions = targets.map((item) => {
      return {label: `Item ${item.id}`, value: item.id};
    });

    return [{label: 'No parent', value: ''}, ...targetOptions];
  }, [getMoveTargets, itemId]);

  const defaultParent: { label: string; value: string } = useMemo(() => {
    console.log("defaultParent update");

    const path = getPathToItem(itemId);
    const parentId = path[path.length - 1] ?? '';
    const option = options.find((option) => option.value === parentId);
    invariant(option);
    return option;
  }, [getPathToItem, itemId, options]);

  const [parentId, setParentId] = useState(defaultParent.value);
  const positionOptions = useMemo(() => {
    console.log("positionOptions update");

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
        targetId: data.parent,
        /**
         * Subtract one to convert the position back to an index
         */
        index: data.position - 1,
      });
    },
    [dispatch, itemId],
  );

  useEffect(() => {
    console.log(defaultParent.value, parentId, "parent");
    form.setValue('parent', parentId);
    form.setValue('position', positionOptions[0].value);
  }, []);

  // const parentSelectRef = useRef(null);

  return (
    <Dialog defaultOpen onOpenChange={(open) => !open && onClose()} aria-hidden="undefined">
      <DialogContent aria-describedby={undefined} className="bg-white">
        <DialogHeader>
          <DialogTitle>Move</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
            <FormField
              control={form.control}
              name="parent"
              render={() => (
                <FormItem>
                  <FormLabel>Parent</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      invariant(value !== null);
                      setParentId(value === "NONE" ? "" : value);
                      form.setValue('parent', value === "NONE" ? "" : value);
                    }}
                    defaultValue={defaultParent.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a verified email to display" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      {options.map((option) => (
                        <SelectItem key={option.value} value={option.value || "NONE"}>{option.label}</SelectItem>
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
            <Button type="button" appearance="subtle" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Submit</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// function PositionSelectField({
//                                options,
//                                setFieldValue,
//                              }: {
//   options: readonly { label: string; value: number }[];
//   setFieldValue: (name: string, value: any) => void;
// }) {
//   /**
//    * Whenever the options change we are resetting the value to the first value.
//    *
//    * This is to prevent an out of bounds selection.
//    */
//   useEffect(() => {
//     setFieldValue('position', options[0]);
//   }, [options, setFieldValue]);
//
//   return (
//     <Field<{ value: number } | null>
//       id="position"
//       name="position"
//       label="Position"
//       isRequired
//       defaultValue={options[0]}
//     >
//       {({fieldProps}) => <Select {...fieldProps} menuPosition="fixed" options={options}/>}
//     </Field>
//   );
// }

export default ActionsDialog;
