import React, { FC, useState, useRef, useEffect } from "react";
import { Collapse, FormControl } from "react-bootstrap";

type BasicInputSeveralRowsProps = {
  placeholder: string | undefined;
  open?: boolean;
  disabled?: boolean;
  required?: boolean;

  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onEnter?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
};

const BasicInputSeveralRows: FC<BasicInputSeveralRowsProps> = ({
  placeholder,
  open = true,
  disabled = false,
  required = true,
  onChange,
  onEnter,
}) => {
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const [rows, setRows] = useState(1);

  const adjustHeight = () => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto"; // Reset height to recalculate
      const scrollHeight = textAreaRef.current.scrollHeight;
      const lineHeight = 15; // Approximate line height
      const maxHeight = 5 * lineHeight;

      if (scrollHeight > maxHeight) {
        textAreaRef.current.style.height = `${maxHeight}px`; // Limit height
        textAreaRef.current.style.overflowY = "scroll"; // Show scrollbar
      } else {
        textAreaRef.current.style.height = `${scrollHeight}px`;
        textAreaRef.current.style.overflowY = "hidden"; // Hide scrollbar when not needed
      }
    }
  };

  useEffect(() => {
    adjustHeight();
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) onChange(e);
    adjustHeight();
  };

  return (
    <Collapse in={open}>
      <FormControl
        as="textarea"
        ref={textAreaRef}
        className="p-2 ml-3 mt-3 h-10 rounded-1 thick-border bg-[#f0f2f5]"
        placeholder={placeholder}
        onChange={handleInput}
        onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
          if (e.key === "Enter") {
            onEnter && onEnter(e);
          }
        }}
        disabled={disabled}
        required={required}
        style={{
          resize: "none",
          overflowY: "hidden",
          minHeight: "15px",
        }}
      />
    </Collapse>
  );
};

export default BasicInputSeveralRows;
