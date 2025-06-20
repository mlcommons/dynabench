import React, { ChangeEvent, FC } from "react";
import { useHistory } from "react-router-dom";
import { useTranslation } from "react-i18next";

const SearchBar: FC = () => {
  const history = useHistory();
  const { t } = useTranslation();

  const onSearchInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const params = new URLSearchParams();
    params.append("task", event.target.value);
    history.push({
      pathname: "/tasks",
      search: params.toString(),
    });
  };

  return (
    <div className="relative text-gray-600">
      <input
        type="search"
        name="serch"
        placeholder={t("common:labels.search")}
        onChange={onSearchInputChange}
        className="pl-4 pr-12 text-sm bg-white rounded-full h-11 focus:outline-none"
      />
      <button type="submit" className="absolute top-0 right-0 mt-3 mr-4">
        <svg
          className="w-4 h-4 fill-current"
          version="1.1"
          id="Capa_1"
          x="0px"
          y="0px"
          viewBox="0 0 56.966 56.966"
          width="512px"
          height="512px"
        >
          <path d="M55.146,51.887L41.588,37.786c3.486-4.144,5.396-9.358,5.396-14.786c0-12.682-10.318-23-23-23s-23,10.318-23,23  s10.318,23,23,23c4.761,0,9.298-1.436,13.177-4.162l13.661,14.208c0.571,0.593,1.339,0.92,2.162,0.92  c0.779,0,1.518-0.297,2.079-0.837C56.255,54.982,56.293,53.08,55.146,51.887z M23.984,6c9.374,0,17,7.626,17,17s-7.626,17-17,17  s-17-7.626-17-17S14.61,6,23.984,6z" />
        </svg>
      </button>
    </div>
  );
};

export default SearchBar;
