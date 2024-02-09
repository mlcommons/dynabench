import React, { useState } from "react";
import { Dropdown, DropdownButton } from "react-bootstrap";
import BootstrapTable from "react-bootstrap-table-next";
import paginationFactory from "react-bootstrap-table2-paginator";

const PairLanguageLeaderboard = () => {
  const [selectedLanguage, setSelectedLanguage] = useState("en-fr");

  const pairLanguages = [
    "en-fr",
    "en-de",
    "en-es",
    "en-ru",
    "en-zh",
    "en-tr",
    "en-ar",
    "en-ja",
    "en-ko",
    "en-pt",
    "en-it",
  ];

  const resultModels = [
    {
      name: "BERTO",
      score: 0.5,
    },
    {
      name: "BART",
      score: 0.8,
    },
    {
      name: "T5",
      score: 0.9,
    },
    {
      name: "MBART",
      score: 0.7,
    },
    {
      name: "XLM",
      score: 0.6,
    },
  ];

  const columns = [
    {
      dataField: "name",
      text: "Model",
      sort: true,
    },
    {
      dataField: "score",
      text: "BLEU",
      sort: true,
    },
  ];

  const pageButtonRenderer = ({ page, onPageChange }: any) => {
    const handleClick = (e: any) => {
      e.preventDefault();
      onPageChange(page);
    };

    return (
      <li className="mb-2 page-item ">
        <a
          href="/"
          className="page-link"
          onClick={handleClick}
          style={{ color: "#4a5568" }}
        >
          {page}
        </a>
      </li>
    );
  };

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg ">
      <div className="">
        <div className="flex flex-row items-center justify-between px-4 py-2">
          <div className="flex flex-col">
            <h2 className="m-0 text-base text-uppercase text-reset">
              Pair Language Leaderboard {selectedLanguage}
            </h2>
          </div>
          <DropdownButton
            variant="light"
            className="z-50 font-bold border-0 min-h-fit font-weight-bold text-letter-color"
            style={{ marginRight: 10 }}
            id="dropdown-basic-button"
            title={selectedLanguage}
          >
            {pairLanguages &&
              pairLanguages.map((pairLanguage) => (
                <Dropdown.Item
                  key={pairLanguage}
                  onClick={() => {
                    setSelectedLanguage(pairLanguage);
                  }}
                >
                  {pairLanguage}
                </Dropdown.Item>
              ))}
          </DropdownButton>
        </div>
      </div>
      <BootstrapTable
        keyField="name"
        data={resultModels}
        columns={columns}
        sort={{ dataField: "score", order: "desc" }}
        pagination={paginationFactory({
          sizePerPage: 15,
          showTotal: true,
          pageButtonRenderer,
          hideSizePerPage: true,
          hidePageListOnlyOnePage: true,
          paginationTotalRenderer(from, to, size) {
            return (
              <div className="flex flex-row items-center justify-between">
                <span className="pt-2 ml-3 ">
                  Showing {from} to {to} of {size}
                </span>
              </div>
            );
          },
        })}
      />
    </div>
  );
};

export default PairLanguageLeaderboard;
