import React from "react";

const ErrorPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <img
        src="/error_page.png"
        alt="404 Not Found"
        className="mb-8 w-80 h-80 rounded-full"
      />
      <h3 className="text-4xl font-bold mb-4">Oops!</h3>
      <p className="text-lg">
        The page you are looking for does not exist or is temporary down.
      </p>
    </div>
  );
};

export default ErrorPage;
