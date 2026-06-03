"use client"

function ReporterTopTab({ tab, index, totaltab, activetab }) {
  return (
    <>
      <div className={`step ${tab?.step_number <= activetab ? (tab?.step_number < activetab ? 'crossed' : 'active') : ''}`} data-target="#account-details">
        <button type="button" className="step-trigger" aria-selected="true">
          <span className="bs-stepper-circle"><i className="icon-base ri ri-check-line"></i></span>
          <span className="bs-stepper-label">
            <span className="bs-stepper-number">{tab?.step_number}</span>
            <span className="d-flex flex-column gap-1 ms-2">
              <span className="bs-stepper-title">{tab?.title}</span>
              <span className="bs-stepper-subtitle">{tab?.subtitle}</span>
            </span>
          </span>
        </button>
      </div>
      {(totaltab - 1 != index) && <div className="line"></div>}
    </>
  )
}

export default ReporterTopTab