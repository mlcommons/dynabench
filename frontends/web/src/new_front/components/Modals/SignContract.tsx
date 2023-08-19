import React, { FC, useContext, useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import Form from "react-bootstrap/Form";
import { useForm } from "react-hook-form";
import Modal from "react-bootstrap/Modal";
import useFetch from "use-http";
import Swal from "sweetalert2";
import UserContext from "containers/UserContext";
import { useHistory } from "react-router-dom";
import { checkUserIsLoggedIn } from "new_front/utils/helpers/functions/LoginFunctions";

type SignContractProps = {
  handleClose: () => void;
};

const SignContract: FC<SignContractProps> = ({ handleClose }) => {
  const [checkboxDisabled, setCheckboxDisabled] = useState(true);
  const { user } = useContext(UserContext);
  const history = useHistory();
  const initState = {
    nameTask: "",
    taskCode: "",
    shortDescription: "",
    description: "",
  };

  const handleScroll = (e: any) => {
    const element = e.target;
    if (element.scrollHeight - element.scrollTop === element.clientHeight) {
      setCheckboxDisabled(false);
    }
  };

  const isLogin = async () => {
    await checkUserIsLoggedIn(history, `/`);
  };

  useEffect(() => {
    isLogin();
  }, []);

  return (
    <div className="p-4 rounded-lg">
      <Modal.Header closeButton>
        <Modal.Title className="text-2xl font-bold text-letter-color">
          Contract
        </Modal.Title>
      </Modal.Header>
      <Modal.Body onScroll={handleScroll}>
        <div className="overflow-auto max-h-64" onScroll={handleScroll}>
          <p className="text-sm text-letter-color">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas id
            velit ut velit dictum hendrerit. Fusce tincidunt lorem at velit
            feugiat, id egestas felis facilisis. Nulla facilisi. Pellentesque
            habitant morbi tristique senectus et netus et malesuada fames ac
            turpis egestas. Vivamus nec libero eget tellus feugiat blandit.
            Nulla sagittis felis a dolor consectetur consequat. Maecenas
            consectetur, libero a tincidunt blandit, orci lectus vulputate
            tortor, ut auctor dolor ex et nisl. Sed et euismod mi, a efficitur
            est. Sed eu convallis eros, eget posuere odio. Nam vitae elit nec ex
            tempus rhoncus. Nulla facilisi. Lorem ipsum dolor sit amet,
            consectetur adipiscing elit. Maecenas id velit ut velit dictum
            hendrerit. Fusce tincidunt lorem at velit feugiat, id egestas felis
            facilisis. Nulla facilisi. Pellentesque habitant morbi tristique
            senectus et netus et malesuada fames ac turpis egestas. Vivamus nec
            libero eget tellus feugiat blandit. Nulla sagittis felis a dolor
            consectetur consequat. Maecenas consectetur, libero a tincidunt
            blandit, orci lectus vulputate tortor, ut auctor dolor ex et nisl.
            Sed et euismod mi, a efficitur est. Sed eu convallis eros, eget
            posuere odio. Nam vitae elit nec ex tempus rhoncus. Nulla facilisi.
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas id
            velit ut velit dictum hendrerit. Fusce tincidunt lorem at velit
            feugiat, id egestas felis facilisis. Nulla facilisi. Pellentesque
            habitant morbi tristique senectus et netus et malesuada fames ac
            turpis egestas. Vivamus nec libero eget tellus feugiat blandit.
            Nulla sagittis felis a dolor consectetur consequat. Maecenas
            consectetur, libero a tincidunt blandit, orci lectus vulputate
            tortor, ut auctor dolor ex et nisl. Sed et euismod mi, a efficitur
            est. Sed eu convallis eros, eget posuere odio. Nam vitae elit nec ex
            tempus rhoncus. Nulla facilisi. Lorem ipsum dolor sit amet,
            consectetur adipiscing elit. Maecenas id velit ut velit dictum
            hendrerit. Fusce tincidunt lorem at velit feugiat, id egestas felis
            facilisis. Nulla facilisi. Pellentesque habitant morbi tristique
            senectus et netus et malesuada fames ac turpis egestas. Vivamus nec
            libero eget tellus feugiat blandit. Nulla sagittis felis a dolor
            consectetur consequat. Maecenas consectetur, libero a tincidunt
            blandit, orci lectus vulputate tortor, ut auctor dolor ex et nisl.
            Sed et euismod mi, a efficitur est. Sed eu convallis eros, eget
            posuere odio. Nam vitae elit nec ex tempus rhoncus. Nulla facilisi.
          </p>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="my-3 form-check">
          <input
            type="checkbox"
            className="form-check-input"
            disabled={checkboxDisabled}
            onClick={handleClose}
          />
          <label className="form-check-label text-letter-color">
            I agree to the terms and conditions
          </label>
        </div>
      </Modal.Footer>
    </div>
  );
};

export default SignContract;
