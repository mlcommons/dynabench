import React from 'react'

const PaperPage = ({ paperUrl }) => {
  return (
    <div
      style={{
        'padding-top': '20px',
        'text-align': 'center',
      }}
    >
      <iframe
        id="iFrame1"
        src={`${'https://vision-dataperf.s3.eu-west-3.amazonaws.com/papers/Perturbation_Augmentation_for_Fairer_NLP__EMNLP_2022_+(3).pdf'}#view=fitH`}
        title="PDF"
        height="840vh"
        width="90%"
      ></iframe>
    </div>
  )
}

export default PaperPage
