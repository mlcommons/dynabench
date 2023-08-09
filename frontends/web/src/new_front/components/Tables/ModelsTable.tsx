import React, { FC, useMemo } from "react";
import { MaterialReactTable, MRT_ColumnDef } from "material-react-table";
import { ModelsInfo } from "new_front/types/model/modelInfo";
import useFetch from "use-http";
import Swal from "sweetalert2";

type ModelsTableProps = {
  modelsInfo: ModelsInfo[];
};

const ModelsTable: FC<ModelsTableProps> = ({ modelsInfo }) => {
  const { get, response, loading } = useFetch();

  const columnsModels = useMemo<MRT_ColumnDef<ModelsInfo>[]>(
    () => [
      {
        accessorKey: "id",
        header: "ID",
        type: "number",
        size: 100,
      },
      {
        accessorKey: "name",
        header: "Name",
      },
      {
        accessorKey: "task",
        header: "Task",
      },
      {
        accessorKey: "community",
        header: "Community",
      },
      {
        accessorKey: "score",
        header: "Score",
        type: "number",
        size: 100,
        Cell: ({ renderedCellValue }) => {
          // If there are an score, show it with just two decimals, otherwise show a 0
          return (
            <div>
              {typeof renderedCellValue === "number"
                ? renderedCellValue.toFixed(2)
                : "0"}
            </div>
          );
        },
      },
      {
        accessorKey: "upload_datetime",
        header: "Date",
        type: "date",
        size: 120,
        Cell: ({ renderedCellValue }) => {
          const date =
            typeof renderedCellValue === "string"
              ? new Date(renderedCellValue)
              : null;
          const formattedDate = date ? date.toLocaleDateString() : "";
          return (
            <div>
              {renderedCellValue
                ? new Date(formattedDate).toLocaleDateString()
                : ""}
            </div>
          );
        },
      },
      {
        accessorKey: "is_published",
        header: "Status",
        size: 130,
        Cell: ({ renderedCellValue, row }) => {
          return (
            <div>
              {renderedCellValue ? (
                <span
                  className="text-[13px] badge badge-success pointer"
                  onClick={() => {
                    window.open(`/models/${row.original.id}`, "_blank");
                  }}
                >
                  Published
                </span>
              ) : (
                <span
                  className="text-[13px] badge badge-danger pointer"
                  onClick={() => {
                    window.open(`/models/${row.original.id}`, "_blank");
                  }}
                >
                  Not Published
                </span>
              )}
            </div>
          );
        },
      },
    ],
    []
  );

  const handleDeleteModel = async (modelId: number) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This action will delete the model permanently",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const response = await get(`/models/delete_model/${modelId}`);
        if (response.ok) {
          Swal.fire({
            title: "Deleted!",
            text: "The model has been deleted.",
            icon: "success",
            showConfirmButton: false,
            timer: 1500,
          });
        } else {
          Swal.fire({
            title: "Error!",
            text: "The model could not be deleted.",
            icon: "error",
            showConfirmButton: false,
            timer: 1500,
          });
        }
      }
    });
  };

  return (
    <MaterialReactTable
      columns={columnsModels}
      data={modelsInfo}
      enableRowActions={true}
      renderRowActions={({ row }) => (
        <div className="flex justify-around">
          <div
            onClick={() => window.open(`/models/${row.original.id}`, "_blank")}
            className="cursor-pointer"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              width="26px"
              height="26px"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                {" "}
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M7.5 11C6.94772 11 6.5 11.4477 6.5 12C6.5 12.5523 6.94772 13 7.5 13C8.05228 13 8.5 12.5523 8.5 12C8.5 11.4477 8.05228 11 7.5 11ZM5.5 12C5.5 10.8954 6.39543 10 7.5 10C8.60457 10 9.5 10.8954 9.5 12C9.5 13.1046 8.60457 14 7.5 14C6.39543 14 5.5 13.1046 5.5 12Z"
                  fill="#2088ef"
                ></path>{" "}
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M16.5 11C15.9477 11 15.5 11.4477 15.5 12C15.5 12.5523 15.9477 13 16.5 13C17.0523 13 17.5 12.5523 17.5 12C17.5 11.4477 17.0523 11 16.5 11ZM14.5 12C14.5 10.8954 15.3954 10 16.5 10C17.6046 10 18.5 10.8954 18.5 12C18.5 13.1046 17.6046 14 16.5 14C15.3954 14 14.5 13.1046 14.5 12Z"
                  fill="#2088ef"
                ></path>{" "}
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10 15.5C10.2761 15.5 10.5 15.7239 10.5 16L10.5003 16.0027C10.5003 16.0027 10.5014 16.0073 10.5034 16.0122C10.5074 16.022 10.5171 16.0405 10.5389 16.0663C10.5845 16.1202 10.6701 16.1902 10.8094 16.2599C11.0883 16.3993 11.5085 16.5 12 16.5C12.4915 16.5 12.9117 16.3993 13.1906 16.2599C13.3299 16.1902 13.4155 16.1202 13.4611 16.0663C13.4829 16.0405 13.4926 16.022 13.4966 16.0122C13.4986 16.0073 13.4997 16.0027 13.4997 16.0027L13.5 16C13.5 15.7239 13.7239 15.5 14 15.5C14.2761 15.5 14.5 15.7239 14.5 16C14.5 16.5676 14.0529 16.9468 13.6378 17.1543C13.1928 17.3768 12.6131 17.5 12 17.5C11.3869 17.5 10.8072 17.3768 10.3622 17.1543C9.9471 16.9468 9.5 16.5676 9.5 16C9.5 15.7239 9.72386 15.5 10 15.5Z"
                  fill="#2088ef"
                ></path>{" "}
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M16 5.5V7.5H8V5.5C8 5.22386 7.77614 5 7.5 5C7.22386 5 7 5.22386 7 5.5V7.5H6C4.61929 7.5 3.5 8.61929 3.5 10V17C3.5 18.3807 4.61929 19.5 6 19.5H18C19.3807 19.5 20.5 18.3807 20.5 17V10C20.5 8.61929 19.3807 7.5 18 7.5H17V5.5C17 5.22386 16.7761 5 16.5 5C16.2239 5 16 5.22386 16 5.5ZM6 8.5C5.17157 8.5 4.5 9.17157 4.5 10V17C4.5 17.8284 5.17157 18.5 6 18.5H18C18.8284 18.5 19.5 17.8284 19.5 17V10C19.5 9.17157 18.8284 8.5 18 8.5H6Z"
                  fill="#2088ef"
                ></path>{" "}
              </g>
            </svg>
          </div>
          <div
            onClick={() => handleDeleteModel(row.original.id)}
            className="cursor-pointer flex justify-around"
          >
            <svg
              fill="#dc3545"
              version="1.1"
              id="Capa_1"
              xmlns="http://www.w3.org/2000/svg"
              width="20px"
              height="20px"
              viewBox="0 0 482.428 482.429"
            >
              <g>
                <g>
                  <path
                    d="M381.163,57.799h-75.094C302.323,25.316,274.686,0,241.214,0c-33.471,0-61.104,25.315-64.85,57.799h-75.098
			c-30.39,0-55.111,24.728-55.111,55.117v2.828c0,23.223,14.46,43.1,34.83,51.199v260.369c0,30.39,24.724,55.117,55.112,55.117
			h210.236c30.389,0,55.111-24.729,55.111-55.117V166.944c20.369-8.1,34.83-27.977,34.83-51.199v-2.828
			C436.274,82.527,411.551,57.799,381.163,57.799z M241.214,26.139c19.037,0,34.927,13.645,38.443,31.66h-76.879
			C206.293,39.783,222.184,26.139,241.214,26.139z M375.305,427.312c0,15.978-13,28.979-28.973,28.979H136.096
			c-15.973,0-28.973-13.002-28.973-28.979V170.861h268.182V427.312z M410.135,115.744c0,15.978-13,28.979-28.973,28.979H101.266
			c-15.973,0-28.973-13.001-28.973-28.979v-2.828c0-15.978,13-28.979,28.973-28.979h279.897c15.973,0,28.973,13.001,28.973,28.979
			V115.744z"
                  />
                  <path
                    d="M171.144,422.863c7.218,0,13.069-5.853,13.069-13.068V262.641c0-7.216-5.852-13.07-13.069-13.07
			c-7.217,0-13.069,5.854-13.069,13.07v147.154C158.074,417.012,163.926,422.863,171.144,422.863z"
                  />
                  <path
                    d="M241.214,422.863c7.218,0,13.07-5.853,13.07-13.068V262.641c0-7.216-5.854-13.07-13.07-13.07
			c-7.217,0-13.069,5.854-13.069,13.07v147.154C228.145,417.012,233.996,422.863,241.214,422.863z"
                  />
                  <path
                    d="M311.284,422.863c7.217,0,13.068-5.853,13.068-13.068V262.641c0-7.216-5.852-13.07-13.068-13.07
			c-7.219,0-13.07,5.854-13.07,13.07v147.154C298.213,417.012,304.067,422.863,311.284,422.863z"
                  />
                </g>
              </g>
            </svg>
          </div>
        </div>
      )}
    />
  );
};

export default ModelsTable;
