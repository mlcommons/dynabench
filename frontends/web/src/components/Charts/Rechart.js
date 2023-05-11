/*
 * Copyright (c) MLCommons and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from "react";
import {
  Cell,
  Legend,
  LineChart,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
/**
 * API Documentation for Recharts Line Chart - {@link https://recharts.org/en-US/api/LineChart}
 * @param fontSize - Size of font for legend, x axis and y axis labels
 * @param height - height for chart
 * @param left - margin left for chart
 * @param right - margin right for chart
 * @param verticalAlign - position of legend, whether it should be below graph, above, in middle
 * @param xAxisLeftPadding - left padding for x axis ticks
 */
// Defaults for mobile

export const LineRechart = ({
  size: {
    fontSize = 10,
    height = 250,
    left = -40,
    right = 10,
    xAxisLeftPadding = 25,
  },
  data,
}) => {
  const mergedObject = Object.assign({}, ...data);
  // This only handles up to 10 chart lines, not sure what we can do if there's more.
  const dataset = Object.keys(mergedObject).filter((item) => item !== "round");
  if (dataset.length > 10) {
    const difference = dataset.length - 10;
    for (let i = 0; i < difference; i++) {
      const newColor = generateColors();
      globalColors.push(newColor);
    }
  }
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart margin={{ left, right }} data={data}>
        <XAxis
          allowDecimals={false}
          dataKey="round"
          padding={{ left: xAxisLeftPadding }}
          tick={{ fontSize }}
          tickLine={false}
        />
        <YAxis padding={{ top: 10 }} tick={{ fontSize }} />
        <Tooltip wrapperStyle={{ zIndex: 10 }} />
        <Legend
          align="center"
          layout="horizontal"
          wrapperStyle={{
            fontSize,
          }}
          verticalAlign="bottom"
        />
        {dataset.map((item, index) => (
          <Line
            key={index}
            dataKey={item}
            dot={{ fill: globalColors[index] }}
            stroke={globalColors[index]}
            strokeWidth={2}
            type="linear"
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

/**
 * API Documentation for Recharts Line Chart - {@link https://recharts.org/en-US/api/PieChart}
 * Disabled animation for now, it bugs out the labels
 * Custom label to only show text if the value is greater than 5
 * Any less makes the labels overlap
 * Hover to see the name and value of the area you're hovering
 * Amount of labels should always match the amount of data given
 */
export const PieRechart = ({ data, labels }) => {
  const chartData = labels.map((item, index) => {
    return { name: item, value: Number((data[index] * 100).toFixed(2)) };
  });
  return (
    <ResponsiveContainer width="100%" height={150}>
      <PieChart>
        <Tooltip payload={chartData} />
        <Pie
          isAnimationActive={false}
          data={chartData}
          dataKey="value"
          labelLine={false}
          nameKey="name"
          outerRadius={50}
          label={({
            cx,
            cy,
            midAngle,
            innerRadius,
            outerRadius,
            value,
            index,
          }) => {
            const RADIAN = Math.PI / 180;
            const radius = 5 + innerRadius + (outerRadius - innerRadius);
            const x = cx + radius * Math.cos(-midAngle * RADIAN);
            const y = cy + radius * Math.sin(-midAngle * RADIAN);
            return value > 5 ? (
              <text
                x={x}
                y={y}
                fill={globalColors[index]}
                textAnchor={x > cx ? "start" : "end"}
                dominantBaseline="central"
              >
                {value}%
              </text>
            ) : null;
          }}
        >
          {chartData.map((entry, index) => (
            <Cell fill={globalColors[index]} key={`cell-${index}`} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};

/**
 * Generates colors between blue and green ranges if the dataset needs to plot more than 10 lines
 * #46 is set as R value so that the green and blue values aren't too light or dark
 */
const generateColors = () => {
  let hex = "#46";
  for (let i = 0; i < 2; i++) {
    let colorValue = Number(
      Math.floor(Math.round((Math.random() * 255) / 10) * 10)
    ).toString(16);
    if (colorValue.length < 2) {
      colorValue = "0" + colorValue;
    }
    hex += colorValue;
  }
  return hex;
};

const globalColors = [
  "#6fb98f",
  "#075756",
  "#66a5ad",
  "#31bdb5",
  "#91d8d3",
  "#90b96f",
  "#a1de72",
  "#8ce882",
  "#1283d8",
  "#314dbd",
];
