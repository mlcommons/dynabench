import React, { FC } from "react";
import Badge from "containers/Badge";

type BadgeProps = {
  badges: any[];
};

const BadgetsCard: FC<BadgeProps> = ({ badges }) => {
  return (
    <div>
      {badges ? (
        <div className="grid grid-cols-2 gap-16 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {badges.map(({ name, awarded }, idx) => (
            <center key={idx}>
              <Badge name={name} awarded={awarded} />
            </center>
          ))}
        </div>
      ) : (
        "No badges yet"
      )}
    </div>
  );
};

export default BadgetsCard;
