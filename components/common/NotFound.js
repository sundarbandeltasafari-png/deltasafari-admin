import React from 'react'
import LottieReactComponent from './LottieReactComponent'

function NotFound({height, width, classes}) {
    return (
        <>
            <div class="card h-100">
                <div class="card-body d-flex justify-content-center">
                    <div className={classes? classes : 'col-12 col-md-6 col-lg-4'}>
                        <div class="text-center mb-6 pt-2 rounded-3">
                            <LottieReactComponent path={'/lottiefiles/no_search_item.json'} height={height} width={width} />
                        </div>
                        <h4 class="text-center">No Data Found!</h4>
                    </div>
                </div>
            </div>
        </>
    )
}

export default NotFound