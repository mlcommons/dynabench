import React from "react";
import MDEditor from "@uiw/react-md-editor";

const LeaderboardDescription = (description: any) => {
  return (
    <div className="pt-4 mt-4 border">
      <MDEditor.Markdown source={description.description} className="p-4" />
    </div>
  );
};

export default LeaderboardDescription;
