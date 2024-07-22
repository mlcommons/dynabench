import React, { FC, useEffect, useState, useContext } from "react";
import { Button } from "react-bootstrap";
import { TokenAnnotator } from "react-text-annotate";
import useFetch from "use-http";
import { PacmanLoader } from "react-spinners";

import { ContextConfigType } from "new_front/types/createSamples/createSamples/annotationContext";
import { CreateInterfaceContext } from "new_front/context/CreateInterface/Context";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";

import AnnotationInstruction from "new_front/components/OverlayInstructions/Annotation";
import DropdownSearch from "new_front/components/Inputs/DropdownSearch";

import generateLightRandomColor from "new_front/utils/helpers/functions/GenerateRandomLightColor";

type MultipleTagsTypes = {
  preselectedTag?: string;
};

const SelectMultipleTextMultipleTags: FC<
  ContextAnnotationFactoryType & ContextConfigType & MultipleTagsTypes
> = ({ field_names_for_the_model, context, instruction, metadata, tags }) => {
  const { post, loading, response } = useFetch();

  const { updateModelInputs } = useContext(CreateInterfaceContext);
  const [selectionInfo, setSelectionInfo] = useState<any>([]);
  const [localTags, setLocalTags] = useState<any>([]);
  const [tagSelection, setTagSelection] = useState<any>(null);
  const [tagColors, setTagColors] = useState<any>(undefined);
  const [preferedTag, setPreferedTag] = useState<any>(null);
  const [text, setText] = useState<string | undefined>(context);

  const submitButton: HTMLElement | null = document.getElementById("submit");

  useEffect(() => {
    updateModelInputs(
      {
        [field_names_for_the_model.context]: context.context,
      },
      metadata.context
    );

    if (submitButton) {
      submitButton.hidden = true;
      (submitButton as any).disabled = true;
    }
    const tempTags: any[] = [];
    const colors: string[] = [];
    const tempTagColors: any = {};
    tags?.forEach((tag: string) => {
      let color = generateLightRandomColor();
      while (colors.includes(color)) {
        color = generateLightRandomColor();
      }
      colors.push(color);
      tempTags.push({ value: tag, color: color });
      tempTagColors[tag] = color;
    });
    setLocalTags(tempTags);
    setTagColors(tempTagColors);
    if (field_names_for_the_model?.preselected_tag) {
      setPreferedTag(field_names_for_the_model.preselected_tag);
    }
  }, []);

  useEffect(() => {
    if (preferedTag) {
      setTagSelection(localTags.find((tag: any) => tag.value === preferedTag));
      handleSubmit(localTags.find((tag: any) => tag.value === preferedTag));
      submitButton && (submitButton.hidden = false);
    }
  }, [preferedTag]);

  useEffect(() => {
    text &&
      text.length > 0 &&
      submitButton &&
      ((submitButton as any).disabled = false);
  }, [text]);

  const handleSubmit = async (value: string | null) => {
    console.log("in handle submit");
    !value && (value = tagSelection.value);
    submitButton && (submitButton.hidden = false);
    /* const payload = {
      key_name: field_names_for_the_model?.tag_name_search,
      key_value: value,
    }; */
    const bringContext = await post(
      `/context/get_random_context_from_key_value`,
      {
        key_name: field_names_for_the_model?.tag_name_search,
        key_value: "ace-Arab",
      }
    );
    console.log(bringContext);
    if (response.ok) {
      setText(bringContext.text);
    }
  };

  const handleSelectAll = async () => {
    const tokens = text?.split(" ");
    setSelectionInfo([
      {
        start: 0,
        end: tokens?.length,
        tag: tagSelection,
        tokens: tokens,
        color: tagColors[tagSelection],
      },
    ]);
  };

  const handleChange = (value: any) => {
    setSelectionInfo(value);
    console.log("selection", value);
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
      {!text ? (
        <>
          {!loading ? (
            <div className="mt-8">
              <DropdownSearch
                options={localTags}
                value={
                  tagSelection ||
                  `Select a ${
                    field_names_for_the_model?.tag_name_for_display || "tag"
                  }`
                }
                onChange={setTagSelection}
              />
              <div className="col-span-1 pl-2 pr-3" id="select">
                <Button
                  className="border-0 font-weight-bold light-gray-bg task-action-btn"
                  onClick={() => handleSubmit(null)}
                >
                  Select
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32">
              <PacmanLoader color="#ccebd4" loading={loading} size={50} />
            </div>
          )}
        </>
      ) : (
        <>
          <div className="p-2 rounded mt-2">
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
          <div className="mt-8 grid grid-cols-6 gap-4">
            <div className="col-span-5">
              <DropdownSearch
                options={localTags}
                value={tagSelection || "Select a tag"}
                onChange={setTagSelection}
              />
            </div>
            <div className="mx-auto mt-2">
              <Button
                className="border-0 font-weight-bold light-gray-bg task-action-btn"
                onClick={() => handleSelectAll()}
              >
                Select all text area
              </Button>
            </div>
          </div>
        </>
      )}
    </AnnotationInstruction>
  );
};

export default SelectMultipleTextMultipleTags;
