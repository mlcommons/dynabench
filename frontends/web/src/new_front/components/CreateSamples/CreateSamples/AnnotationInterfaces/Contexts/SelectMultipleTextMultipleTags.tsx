import AnnotationInstruction from "new_front/components/OverlayInstructions/Annotation";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { ContextConfigType } from "new_front/types/createSamples/createSamples/annotationContext";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";
import React, { FC, useEffect, useState, useContext } from "react";
import { TokenAnnotator } from "react-text-annotate";
import DropdownSearch from "new_front/components/Inputs/DropdownSearch";

import languages from "./BCP47Temp";

type MultipleTagsTypes = {
  preselectedTag?: string;
};

const text =
  'On 31 January 2014, it was reported that Neesonwould workwith director Martin Scorsese again in an adaptation of the novel "Silence". Neeson had a supporting role as the henchman Bad Cop/Good Cop in the animated film "The Lego Movie", which was a critical and commercial success. Neeson later played Bill Marks in the 2014 action film Non-Stop. The film was releasedon 28 February 2014. He also appeared, uncredited, as God in the BBC2 series "Rev.". Neeson stars in the 2014 film "A Walk Among the Tombstones", an adaption of the best-selling novel of the same name, in which he plays former cop Matthew Scudder, a detective hired to hunt the killers of a drug dealer\'s wife.';

const SelectMultipleTextMultipleTags: FC<
  ContextAnnotationFactoryType & ContextConfigType & MultipleTagsTypes
> = ({
  field_names_for_the_model,
  context,
  instruction,
  metadata,
  preselectedTag,
}) => {
  const { updateModelInputs } = useContext(CreateInterfaceContext);
  const [selectionInfo, setSelectionInfo] = useState<any>([]);
  const [tags, setTags] = useState<any>([]);
  const [tagSelection, setTagSelection] = useState<any>(preselectedTag || null);
  const [tagColors, setTagColors] = useState<any>(undefined);

  const generateRandomColor = (): string => {
    const getRelativeLuminance = (r: number, g: number, b: number): number => {
      const rs = r / 255;
      const gs = g / 255;
      const bs = b / 255;

      const rL =
        rs <= 0.03928 ? rs / 12.92 : Math.pow((rs + 0.055) / 1.055, 2.4);
      const gL =
        gs <= 0.03928 ? gs / 12.92 : Math.pow((gs + 0.055) / 1.055, 2.4);
      const bL =
        bs <= 0.03928 ? bs / 12.92 : Math.pow((bs + 0.055) / 1.055, 2.4);

      return 0.2126 * rL + 0.7152 * gL + 0.0722 * bL;
    };
    let color;
    let luminance;

    do {
      const r = Math.floor(Math.random() * 256);
      const g = Math.floor(Math.random() * 256);
      const b = Math.floor(Math.random() * 256);

      color = `rgb(${r}, ${g}, ${b})`;
      luminance = getRelativeLuminance(r, g, b);
    } while (luminance < 0.7); // Adjust the threshold as needed

    return color;
  };

  useEffect(() => {
    updateModelInputs(
      {
        [field_names_for_the_model.context]: context.context,
      },
      metadata.context
    );

    const tempTags: any[] = [];
    const colors: string[] = [];
    const tempTagColors: any = {};
    languages.forEach((tag: string) => {
      let color = generateRandomColor();
      while (colors.includes(color)) {
        color = generateRandomColor();
      }
      colors.push(color);
      tempTags.push({ value: tag, color: color });
      tempTagColors[tag] = color;
    });
    setTagSelection(tempTags.find((tag) => tag.value === preselectedTag));
    setTags(tempTags);
    setTagColors(tempTagColors);
  }, []);

  const handleChange = (value: any) => {
    setSelectionInfo(value);
    console.log("seleccion", value);
    /* updateModelInputs(
      {
        [field_names_for_the_model.answer ?? "selectable_text"]: context.context
          .split(" ")
          .slice(value[0].start, value[0].end)
          .join(" "),
      },
      metadata.answer
    ); */
  };

  return (
    <AnnotationInstruction
      placement="top"
      tooltip={
        instruction?.context ||
        "Select the tag and the text according to the tag"
      }
    >
      <>
        <div className="p-2 rounded">
          <TokenAnnotator
            tokens={text.split(" ")}
            value={selectionInfo}
            onChange={(value) => handleChange(value)}
            getSpan={(span) => ({
              ...span,
              tag: tagSelection,
              color: tagColors[tagSelection],
            })}
            renderMark={(props) => (
              <mark
                key={props.key}
                onClick={() =>
                  props.onClick({
                    start: props.start,
                    end: props.end,
                    tag: props.tag,
                    color: props.color,
                    content: props.content,
                  })
                }
                style={{
                  padding: ".2em .3em",
                  margin: "0 .25em",
                  lineHeight: "1",
                  display: "inline-block",
                  borderRadius: ".25em",
                  background: tagColors[props.tag],
                }}
              >
                {props.content}{" "}
                <span
                  style={{
                    boxSizing: "border-box",
                    content: "attr(data-entity)",
                    fontSize: ".55em",
                    lineHeight: "1",
                    padding: ".35em .35em",
                    borderRadius: ".35em",
                    textTransform: "uppercase",
                    display: "inline-block",
                    verticalAlign: "middle",
                    margin: "0 0 .15rem .5rem",
                    background: "#fff",
                    fontWeight: "700",
                  }}
                >
                  {" "}
                  {props.tag}
                </span>
              </mark>
            )}
          />
        </div>
        <div>
          <DropdownSearch
            options={tags}
            value={tagSelection || "Select a tag"}
            onChange={setTagSelection}
          />
        </div>
      </>
    </AnnotationInstruction>
  );
};

export default SelectMultipleTextMultipleTags;
