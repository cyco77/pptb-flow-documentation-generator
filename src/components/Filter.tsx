import type {
  JSXElement,
  OptionOnSelectData,
  SelectionEvents,
} from "@fluentui/react-components";
import {
  Dropdown,
  makeStyles,
  Option,
  useId,
} from "@fluentui/react-components";
import { FLowDefinition } from "../types/flowDefinition";

export interface IFilterProps {
  flowDefinitions: FLowDefinition[];
  onFilterChanged: (flowDefinition: string | undefined) => void;
}

export const Filter = (props: IFilterProps): JSXElement => {
  const dropdownId = useId("dropdown");

  const { flowDefinitions } = props;

  const onOptionSelect = (
    _event: SelectionEvents,
    data: OptionOnSelectData
  ) => {
    props.onFilterChanged(data.optionValue ?? "");
  };

  const sortedItems = [...flowDefinitions].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const useStyles = makeStyles({
    root: {
      display: "flex",
      gap: "20px",
      alignItems: "flex-end",
    },
    field: {
      display: "grid",
      justifyItems: "start",
      gap: "2px",
    },
    dropdown: {
      minWidth: "450px",
    },
    searchInput: {
      minWidth: "250px",
    },
    option: {
      whiteSpace: "nowrap",
    },
  });

  const styles = useStyles();

  return (
    <div className={styles.root}>
      <div className={styles.field}>
        <label htmlFor={`${dropdownId}-flow-definition`}>Flow</label>
        <Dropdown
          id={dropdownId}
          placeholder="Select an flow"
          onOptionSelect={onOptionSelect}
          className={styles.dropdown}
        >
          {sortedItems.map((option) => (
            <Option
              key={option.workflowid}
              value={option.workflowid}
              className={styles.option}
            >{`${option.name}`}</Option>
          ))}
        </Dropdown>
      </div>
    </div>
  );
};
