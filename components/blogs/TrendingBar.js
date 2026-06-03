import React from 'react'

function TrendingBar() {
    return (
        <>
            <div className="db-trending-bar">
                <span className="db-trending-label">Trending</span>
                <div className="db-trending-scroll">
                    <a href="#" className="db-trend-pill">US-Iran talks <i className="bi bi-chevron-right"></i></a>
                    <a href="#" className="db-trend-pill">heat stroke <i className="bi bi-chevron-right"></i></a>
                    <a href="#" className="db-trend-pill">Chardham <i className="bi bi-chevron-right"></i></a>
                    <a href="#" className="db-trend-pill">IPL 2026 <i className="bi bi-chevron-right"></i></a>
                    <a href="#" className="db-trend-pill">Bihar CM <i className="bi bi-chevron-right"></i></a>
                    <a href="#" className="db-trend-pill">Budget 2026 <i className="bi bi-chevron-right"></i></a>
                </div>
            </div>
        </>
    )
}

export default TrendingBar