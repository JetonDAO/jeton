import type { ChangeEvent } from "react";

export interface LabelInputProps {
  label: string;
  value?: string | number | undefined;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  name: string;
  required?: boolean;
  placeholder?: string;
}

export function Input({
  label,
  value,
  onChange,
  type = "text",
  name,
  required = true,
  placeholder,
}: LabelInputProps) {
  return (
    <div className="nes-field">
      <label className="text-[#eec2af] name_field" htmlFor={name}>
        {label}:
      </label>
      <input
        placeholder={placeholder}
        className="bg-[#b87d5b] nes-input text-white p-2 accent-amber-500 placeholder:text-gray-300 focus:!outline-amber-300"
        type={type}
        value={value}
        name={name}
        onChange={onChange}
        required={required}
      />
    </div>
  );
}
