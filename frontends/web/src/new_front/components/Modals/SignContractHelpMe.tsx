import React, { FC, useState } from "react";
import Modal from "react-bootstrap/Modal";
import Swal from "sweetalert2";

type SignContractHelpMeProps = {
  handleClose: () => void;
};

const SignContractHelpMe: FC<SignContractHelpMeProps> = ({ handleClose }) => {
  const [legalAge, setLegalAge] = useState(false);
  const [consent, setConsent] = useState(false);

  return (
    <div className="p-4 rounded-lg">
      <Modal.Header closeButton>
        <Modal.Title className="text-2xl font-bold text-letter-color">
          Consent
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="max-w-2xl px-4 py-8 mx-auto">
          <h3 className="mb-4 text-2xl font-bold">General Information</h3>
          <p className="mb-4">
            The aim of this research project is to assess current usefulness of
            large language models as assistants in medical self-diagnosis. Large
            language models are a recent type of artificial intelligence
            technology which can generate text responses via a chat interface.
            In this study, we are focused on a possible application of this
            technology in helping people to access relevant information to make
            medical decisions. We are now asking you to test out these models to
            assist you in making decisions in simulated health scenarios.
          </p>
          <p className="mb-4">
            We appreciate your interest in participating in this online task.
            You have been invited to participate as you are over the age of 18.
            Please read through this information before agreeing to participate
            (if you wish to) by ticking the ‘yes’ box below.
          </p>
          <p className="mb-4">
            You may ask any questions before deciding to take part by contacting
            the researcher (details below).
          </p>
          <p className="mb-4">
            The Principal Researcher is Andrew Bean, who is attached to the
            Oxford Internet Institute at the University of Oxford. This project
            is being completed under the supervision of Dr Adam Mahdi.
          </p>
          <p className="mb-4">
            Participants will be asked to complete a few questions about their
            familiarity with the technology being studied and with the medical
            profession. They will then be asked to use a provided language model
            to answer questions about a fictitious healthcare scenario. This
            should take about 10 minutes. No background knowledge is required.
            We will collect the transcripts of the interaction with the language
            model, as well as final responses given to the scenario questions.
            The data will be used to analyse the usefulness of the models as
            assistants in making healthcare decisions.
          </p>
          <p className="mb-4">
            The language models being studied are “generative AI” models,
            meaning that they create novel outputs not known in advance by their
            users. As such, it is possible, though unlikely, that the model
            could generate text which participants find undesirable. If you find
            yourself in such a situation, please feel free to reach out to the
            contacts named below.
          </p>
          <p className="mb-4 font-bold">Do I have to take part?</p>
          <p className="mb-4">
            No. Please note that participation is voluntary. If you do decide to
            take part, you may withdraw at any point for any reason before
            submitting your answers by pressing the ‘Exit’ button/ closing the
            browser.
          </p>
          <p className="mb-4 font-bold">All questions are optional.</p>
          <p className="mb-4 font-bold">How will my data be used?</p>
          <p className="mb-4">
            We will not collect any data that could directly identify you.
          </p>
          <p className="mb-4">
            Your IP address will not be stored. We will take all reasonable
            measures to ensure that data remain confidential.
          </p>
          <p className="mb-4">
            The responses you provide will be stored in a password-protected
            electronic file on University of Oxford secure servers and may be
            used in academic publications, conference presentations, reports or
            websites. Research data will be stored for three years after
            publication or public release of the work of the research.
          </p>
          <p className="mb-4">
            The data that we collect from you may be transferred to, stored and/
            or processed at a destination outside the UK and the European
            Economic Area. By submitting your personal data, you agree to this
            transfer, storing or processing.
          </p>
          <p className="mb-4 font-bold">Who will have access to my data?</p>
          <p className="mb-4">
            The University of Oxford is the data controller with respect to your
            personal data and, as such, will determine how your personal data is
            used in the study. The University will process your personal data
            for the purpose of the research outlined above. Research is a task
            that we perform in the public interest. Further information about
            your rights with respect to your personal data is available from{" "}
            <a
              href="https://compliance.admin.ox.ac.uk/individual-rights"
              className="text-blue-500"
            >
              https://compliance.admin.ox.ac.uk/individual-rights
            </a>
            .
          </p>
          <p className="mb-4">
            The data you provide may be shared with the researchers on this
            project, Andrew Bean and Dr Adam Mahdi.
          </p>
          <p className="mb-4">
            We would also like your permission to use the data in future
            studies, and to share data with other researchers (e.g. in online
            databases). Data will be de-identified before it is shared with
            other researchers or results are made public.
          </p>
          <p className="mb-4">
            The results will be written up in partial fulfilment of the
            requirements for a DPhil degree.
          </p>
          <p className="mb-4 font-bold">Who has reviewed this study?</p>
          <p className="mb-4">
            This project has been reviewed by, and received ethics clearance
            through, a subcommittee of the University of Oxford Central
            University Research Ethics Committee [OII_C1A_23_096].
          </p>
          <p className="mb-4 font-bold">
            Who do I contact if I have a concern or I wish to complain?
          </p>
          <p className="mb-4">
            If you have a concern about any aspect of this study, please speak
            to Andrew Bean (
            <a href="mailto:andrew.bean@oii.ox.ac.uk" className="text-blue-500">
              andrew.bean@oii.ox.ac.uk
            </a>
            ) or his supervisor, Dr Adam Mahdi (
            <a href="mailto:adam.mahdi@oii.ox.ac.uk" className="text-blue-500">
              adam.mahdi@oii.ox.ac.uk
            </a>
            ) and we will do our best to answer your query. I/We will
            acknowledge your concern within 10 working days and give you an
            indication of how it will be dealt with. If you remain unhappy or
            wish to make a formal complaint, please contact the Chair of the
            Research Ethics Committee at the University of Oxford who will seek
            to resolve the matter as soon as possible:
          </p>
          <p className="mb-4">
            Social Sciences & Humanities Interdivisional Research Ethics
            Committee; Email:{" "}
            <a href="mailto:ethics@socsci.ox.ac.uk" className="text-blue-500">
              ethics@socsci.ox.ac.uk
            </a>
            ; Address: Research Services, University of Oxford, Boundary Brook
            House, Churchill Drive, Headington, Oxford OX3 7GB
          </p>
          <p className="mb-4">
            Please note that you may only participate in this survey if you are
            18 years of age or over.
          </p>
          <label htmlFor="age" className="block mb-2">
            <input
              type="checkbox"
              className="form-check-input"
              onClick={() => setLegalAge(!legalAge)}
            />
            I certify that I am 18 years of age or over.
          </label>
          <p className="mb-4">
            If you have read the information above and agree to participate with
            the understanding that the data you submit will be processed
            accordingly, please tick the box below to start.
          </p>
          <input
            type="checkbox"
            className="form-check-input"
            onClick={() => setConsent(!consent)}
          />
          <label htmlFor="consent" className="block mb-2">
            Yes, I agree to take part
          </label>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="my-3 form-check">
          <input
            type="checkbox"
            className="form-check-input"
            disabled={!legalAge || !consent}
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

export default SignContractHelpMe;
