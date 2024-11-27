import React, { FC, useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import { TextAnnotator } from "react-text-annotate";
import { PacmanLoader } from "react-spinners";
import Swal from "sweetalert2";
import useFetch from "use-http";

import { ContextConfigType } from "new_front/types/createSamples/createSamples/annotationContext";
import { ContextAnnotationFactoryType } from "new_front/types/createSamples/createSamples/annotationFactory";

import AnnotationInstruction from "new_front/components/OverlayInstructions/Annotation";
import DropdownSearch from "new_front/components/Inputs/DropdownSearch";
import MultiSelect from "new_front/components/Lists/MultiSelect";

import generateLightRandomColor from "new_front/utils/helpers/functions/GenerateRandomLightColor";

type MultipleTagsTypes = {
  preselectedTag?: string;
};

type Dictionary = { [key: string]: any };

const cleanUpSelection = (
  selection: Array<Dictionary>,
  keyToRemove: string
) => {
  const result: Array<Record<string, any>> = [];

  selection.forEach((dictionary) => {
    const newDictionary: Dictionary = {};

    for (const key in dictionary) {
      if (dictionary.hasOwnProperty(key) && key !== keyToRemove) {
        newDictionary[key] = dictionary[key];
      }
    }

    result.push(newDictionary);
  });

  return result;
};

const SelectMultipleTextMultipleTags: FC<
  ContextAnnotationFactoryType & ContextConfigType & MultipleTagsTypes
> = ({
  field_names_for_the_model,
  instruction,
  userId,
  taskId,
  generative_context,
  realRoundId,
}) => {
  const { post, loading, response } = useFetch();

  const [selectionInfo, setSelectionInfo] = useState<any>([]);
  const [localTags, setLocalTags] = useState<any>([]);
  const [tagSelection, setTagSelection] = useState<any>(null);
  const [tagColors, setTagColors] = useState<any>(undefined);
  const [preferedTag, setPreferedTag] = useState<any>(null);
  const [text, setText] = useState<string | undefined>(undefined);
  const [contextId, setContextId] = useState<number | null>(null);
  const [loading2, setLoading2] = useState<boolean>(false);
  const [extraLabel, setExtraLabel] = useState<any>({});

  const submitButton: HTMLElement | null = document.getElementById("submit");

  useEffect(() => {
    const tempTags: any[] = [];
    const colors: string[] = [];
    const tempTagColors: any = {};
    generative_context?.artifacts?.tags?.forEach((tag: any) => {
      let color = generateLightRandomColor();
      while (colors.includes(color)) {
        color = generateLightRandomColor();
      }
      colors.push(color);
      tempTags.push({
        value: tag?.display_label,
        color: color,
        back_label: tag?.back_label,
      });
      tempTagColors[tag.back_label] = color;
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
      handleSubmit(
        localTags.find((tag: any) => tag.value === preferedTag)?.back_label
      );
    }
  }, [preferedTag]);

  useEffect(() => {
    text?.length && setLoading2(false);
  }, [text]);

  const handleSubmit = (value: string | null) => {
    !value && (value = tagSelection.back_label);
    submitButton && (submitButton.hidden = false);
    setLoading2(true);
    setSelectionInfo([]);
    fetch(
      `${process.env.REACT_APP_API_HOST_2}/context/get_random_context_from_key_value`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          key_name: field_names_for_the_model?.tag_name_search,
          key_value: value,
          real_round_id: realRoundId,
        }),
      }
    )
      .then((response) => response.json())
      .then((data) => {
        !data &&
          Swal.fire({
            title: instruction?.context_alert_title,
            text: instruction?.context_alert_text,
            icon: "warning",
            confirmButtonText: "Ok",
          }).then(() => {
            handleSubmit(field_names_for_the_model?.default_tag);
          });
        console.log("bringContext", data);
        setText(data?.content);
        setContextId(data?.id);
      })
      .catch((error) => {
        console.warn("error", error);
        setLoading2(false);
        Swal.fire({
          title: instruction?.context_alert_title,
          text: instruction?.context_alert_text,
          icon: "warning",
          confirmButtonText: "Ok",
        }).then(() => {
          handleSubmit(field_names_for_the_model?.default_tag);
        });
      });
  };

  const handleSelectAll = async () => {
    const tokens = text?.split("");
    setSelectionInfo([
      {
        start: 0,
        end: tokens?.length,
        tag: tagSelection.back_label,
        text: text,
        color: tagColors[tagSelection.back_label],
      },
    ]);
  };

  const handleSubmitExample = async () => {
    const newSelectionInfo = cleanUpSelection(selectionInfo, "color");
    const sendText = text;
    setText(undefined);
    await post("/example/create_example", {
      context_id: contextId,
      user_id: userId,
      input_json: { labels: newSelectionInfo, ...extraLabel },
      text: sendText,
      task_id: taskId,
      round_id: realRoundId,
      increment_context: true,
    });
    if (response.ok) {
      Swal.fire({
        title: "Success",
        text: "The data has been saved",
        icon: "success",
        confirmButtonText: "Ok",
      }).then(() => {
        handleSubmit(null);
      });
    }
  };

  const handlemultipleSel = (data: any) => {
    setExtraLabel(data);
  };

  const handleChange = (value: any) => {
    const valueLength: number = value?.length;
    const regex = /\S/g;
    if (valueLength < selectionInfo.length) {
      setSelectionInfo(value);
      return;
    }
    const start: number = Math.min(
      value[valueLength - 1].start,
      value[valueLength - 1].end
    );
    const end: number = Math.max(
      value[valueLength - 1].start,
      value[valueLength - 1].end
    );
    if (
      valueLength > 0 &&
      (isNaN(value[valueLength - 1].end) ||
        value[valueLength - 1].text === "" ||
        isNaN(value[valueLength - 1].start) ||
        !value[valueLength - 1].text.match(regex))
    ) {
      return;
    }
    const already = selectionInfo.find(
      (val: any) =>
        (val.start <= start && val.end >= start) ||
        (val.start <= end && val.end >= start)
    );
    value[valueLength - 1].start = start;
    value[valueLength - 1].end = end;
    !already && setSelectionInfo(value);
  };

  return (
    <AnnotationInstruction
      placement="top"
      tooltip={
        instruction?.tooltip ||
        "Select the tag and the text according to the tag"
      }
    >
      {!text ? (
        <>
          {!loading && !loading2 ? (
            <div className="mt-8">
              {instruction?.preselection && (
                <div className="pb-4 text-l font-bold">
                  {instruction?.preselection}
                </div>
              )}
              <DropdownSearch
                options={localTags}
                value={
                  tagSelection?.value ||
                  `Select a ${instruction?.tag_name || "tag"}`
                }
                onChange={setTagSelection}
              />
              <div className="col-span-1 pl-2 pr-3" id="select">
                <Button
                  className="border-0 font-weight-bold light-gray-bg task-action-btn"
                  onClick={() => handleSubmit(null)}
                  disabled={!tagSelection}
                >
                  Select
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid items-center justify-center h-32 grid-rows-2">
              <div className="mr-2 text-letter-color mb-5">
                Data is being prepared, please wait...
              </div>
              <PacmanLoader
                color="#ccebd4"
                loading={loading || loading2}
                size={50}
              />
            </div>
          )}
        </>
      ) : (
        <>
          <div className="p-2 rounded">
            <div className="grid grid-cols-6">
              {instruction?.selection_note && (
                <div className="pb-4 text-l font-bold col-span-8">
                  {instruction?.selection_note}
                </div>
              )}
              <div className="mx-auto mb-4 col-start-10">
                <Button
                  className="border-0 font-weight-bold light-gray-bg task-action-btn"
                  onClick={() => handleSelectAll()}
                >
                  Select all text area
                </Button>
              </div>
            </div>
            <div className="my-3 gap-4 grid grid-cols-3 sticky top-4">
              <div className="col-span-2">
                <DropdownSearch
                  options={localTags}
                  value={
                    tagSelection?.value ||
                    `Select a ${
                      field_names_for_the_model?.tag_name_for_display || "tag"
                    }`
                  }
                  onChange={setTagSelection}
                />
              </div>
            </div>
            <div>
              <TextAnnotator
                style={{ whiteSpace: "pre-line" }}
                content={text}
                value={selectionInfo}
                onChange={(value) => handleChange(value)}
                getSpan={(span) => ({
                  ...span,
                  tag: tagSelection.back_label,
                  color: tagColors[tagSelection.back_label],
                })}
              />
            </div>
            <div className="mt-3">
              <MultiSelect
                options={
                  generative_context?.artifacts?.additional_label?.options
                }
                instructions={
                  generative_context?.artifacts?.additional_label
                    ?.instructions || "Choose any that apply"
                }
                field_name_for_the_model={
                  generative_context?.artifacts?.additional_label
                    ?.extra_label || "content"
                }
                onInputChange={handlemultipleSel}
              />
            </div>
            <div className="mt-8 gap-4 grid grid-cols-6 ">
              <div className="mb-4">
                <Button
                  className="border-0 font-weight-bold light-gray-bg task-action-btn"
                  onClick={() => handleSubmitExample()}
                  disabled={!selectionInfo.length || loading}
                >
                  {loading ? "Loading..." : "Submit"}
                </Button>
              </div>
              <div className="pl-2 col-span-2 col-start-8" id="switchContext">
                <Button
                  className="border-0 font-weight-bold light-gray-bg task-action-btn"
                  onClick={() => {
                    setText(undefined);
                    handleSubmit(null);
                  }}
                >
                  Skip and load a new text
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </AnnotationInstruction>
  );
};

export default SelectMultipleTextMultipleTags;
