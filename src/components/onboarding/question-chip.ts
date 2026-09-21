// The selectable chip look the qualification quiz has always used.
export const CHIP_CLASS =
  "h-auto min-w-0 whitespace-normal rounded-full border border-border px-5 py-3 font-normal text-muted-foreground transition-all hover:border-primary/50 hover:bg-transparent hover:text-muted-foreground data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary data-[state=on]:hover:text-primary-foreground";

// Options beyond this count read better as a dropdown than as a wall of chips.
export const CHIPS_TO_SELECT_THRESHOLD = 8;
