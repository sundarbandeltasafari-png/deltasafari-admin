"use client"

function UserStatusCard({status, description, avatar, colorType}) {
    return (
        <>
            <div className="col-sm-6 col-xl-3">
                <div className="card">
                    <div className="card-body">
                        <div className="d-flex justify-content-between">
                            <div className="me-1">
                                <p className="text-heading mb-1">{status?.title}</p>
                                <div className="d-flex align-items-center">
                                    <h4 className="mb-1 me-2">{status?.total_all_time}</h4>
                                    <p className={`text-${status?.last_month_new > status?.this_month_new ? "danger" : "success"} mb-1`}>({status?.last_month_new > status?.this_month_new ? "-" : "+"}{status?.percentage_growth})</p>
                                </div>
                                <small className="mb-0">{description}</small>
                            </div>
                            <div className="avatar">
                                <div className={`avatar-initial bg-label-${colorType} rounded-3`}>
                                    <div className={`icon-base ${avatar} icon-26px`}></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default UserStatusCard