"use client";

import { RadioButton, RadioButtonProps } from "@ama-pt/agora-design-system";
import { ChangeEvent } from "react";
import { twMerge } from "tailwind-merge";

export type RadioButtonOption = {
  label: string;
  value: string | number | readonly string[];
  key: string;
};

export interface RadioButtonGroupProps {
  options: RadioButtonOption[];
  classNameRadioButton?: string;
}

export default function RadioButtonGroup({
  ...props
}: RadioButtonProps & RadioButtonGroupProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (props.onChange) {
      props.onChange(event);
    }
  };

  return (
    <div className={twMerge("flex gap-32", props.className)}>
      {props.options.map((o) => (
        <RadioButton
          name={props.name}
          label={o.label}
          value={o.value}
          key={o.key}
          onChange={handleChange}
          checked={o.value === props.value}
          darkMode={props.darkMode}
          className={props.classNameRadioButton}
        />
      ))}
    </div>
  );
}
