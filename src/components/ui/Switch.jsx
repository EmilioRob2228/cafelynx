import * as RadixSwitch from "@radix-ui/react-switch";

export function Switch({ checked, onCheckedChange, label }) {
  return (
    <RadixSwitch.Root
      checked={checked}
      onCheckedChange={onCheckedChange}
      aria-label={label}
      className="relative h-7 w-12 shrink-0 rounded-full bg-lince-900/20 transition-colors data-[state=checked]:bg-lince-600"
    >
      <RadixSwitch.Thumb className="block h-5 w-5 translate-x-1 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-6" />
    </RadixSwitch.Root>
  );
}
