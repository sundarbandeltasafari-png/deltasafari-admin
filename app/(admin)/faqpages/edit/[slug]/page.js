"use client"
import { createFaqPageUrl, getFaqPageUrl } from '@/app/routes/pagesRoute';
import LoadingComponent from '@/components/common/LoadingComponent';
import { axiosGet, axiosPost, axiosPut } from '@/libs/axiosHelper';
import { showMessage } from '@/libs/commonHelper';
import { urlDecode } from '@/libs/urlHelper';
import { useParams, useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

const page = ({ onBack }) => {
    const params = useParams();
    const pageId = params?.slug
    if (!pageId) {
        redirect('/faqpages');
    }
    const [faq, setFaq] = useState(null);
    const [loading, setLoading] = useState(true);
    const token = useSelector((state) => state.adminAuth?.token);
    const route = useRouter();

    const [faqList, setFaqList] = useState([
        { id: Date.now(), question: '', answer: '', sort_order: 1}
    ]);

    useEffect(() => {
        axiosPost(getFaqPageUrl, { page_id: urlDecode(pageId) }, token).then((res) => {
            if (res.status) {
                setFaq(res?.faqs)
                setFaqList(res?.faqs)
                setLoading(false)
            } else {
                showMessage(res.msg, "error")
            }
        }).catch((err) => {
            showMessage(err.message)
        })
    }, []);

    const handleFaqItemChange = (index, event) => {
        const { name, value } = event.target;
        const updatedFaqs = [...faqList];
        updatedFaqs[index][name] = value;
        setFaqList(updatedFaqs);
    };

    const addNewFaqRow = () => {
        setFaqList([...faqList, { id: Date.now(), question: '', answer: '', sort_order: faqList.length + 1 }]);
    };

    const removeFaqRow = (index) => {
        const updatedFaqs = faqList.filter((_, i) => i !== index);
        setFaqList(updatedFaqs);
    };

    const handleSubmitAll = async (e) => {
        e.preventDefault();
        if(faqList.length == 0){
            showMessage('Please add atleast one faq.')
            return;
        }
        const formData = new FormData();
        faqList.forEach((item) => {
            formData.append('question[]', item.question || '');
            formData.append('answer[]', item.answer || '');
            formData.append('sort_order[]', item.sort_order || 1);
            formData.append('page_id', pageId);
        });
        axiosPut(createFaqPageUrl, formData, token, 'multipart/form-data').then((res)=>{
            if(res.status){
                route.push('/faqpages')
                showMessage(res?.msg, 'success')
            }else{
                showMessage(res?.msg)
            }
        }).catch((err)=>{
            showMessage(err.message)
        })

    };

    return (
        <div className="container my-5" style={{ fontFamily: "'Public Sans', sans-serif" }}>
            {/* Top Navigation Row */}

            {loading ?
                <LoadingComponent />
                :
                <>
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h4 className="fw-bold mb-1"><span className="text-muted fw-light"></span> Configure FAQ</h4>
                            <p className="text-muted mb-0">Managing layouts and assets for: <strong className="text-primary">{faq[0].page_name} Page</strong></p>
                        </div>
                        <button onClick={onBack} className="btn btn-outline-secondary px-3 btn-sm">
                            <i className="bi bi-arrow-left me-1"></i> Back to List
                        </button>
                    </div>
                    <form onSubmit={handleSubmitAll}>
                        {/* COMPONENT SECTION 2: DYNAMIC MULTIPLE FAQ FIELDS BLOCK */}
                        <div className="card shadow-sm border-0 rounded-3 mb-4">
                            <div className="card-header bg-white border-bottom py-3 d-flex justify-content-between align-items-center">
                                <h5 className="mb-0 fw-semibold text-dark"><i className="bi bi-patch-question text-primary me-2"></i>2. Manage Questions & Answers (FAQ Content)</h5>
                                <button type="button" onClick={addNewFaqRow} className="btn btn-sm btn-success px-3">
                                    <i className="bi bi-plus-circle me-1"></i> Add More Question
                                </button>
                            </div>
                            <div className="card-body p-4 bg-light-subtle">
                                {faqList.map((faq, index) => (
                                    <div className="card border p-3 mb-3 bg-white shadow-sm position-relative rounded-3" key={index}>
                                        <div className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
                                            <span className="badge bg-secondary">FAQ Entry #{index + 1}</span>
                                            {faqList.length > 1 && (
                                                <button type="button" onClick={() => removeFaqRow(index)} className="btn btn-sm btn-link text-danger p-0 text-decoration-none">
                                                    <i className="bi bi-trash-fill me-1"></i> Remove
                                                </button>
                                            )}
                                        </div>
                                        <div className="row">
                                            <div className="col-md-9 mb-2">
                                                <label className="form-label small fw-semibold text-muted">Question Phrase</label>
                                                <input type="text" className="form-control form-control-sm" name="question" value={faq.question} onChange={(e) => handleFaqItemChange(index, e)} required placeholder="Type the question here..." />
                                            </div>
                                            <div className="col-md-3 mb-2">
                                                <label className="form-label small fw-semibold text-muted">Sort Order Rank</label>
                                                <input type="number" className="form-control form-control-sm" name="sort_order" value={faq.sort_order} onChange={(e) => handleFaqItemChange(index, e)} />
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label small fw-semibold text-muted">Detailed Answer Content</label>
                                                <textarea className="form-control form-control-sm" rows="2" name="answer" value={faq.answer} onChange={(e) => handleFaqItemChange(index, e)} required placeholder="Type the corresponding detailed solution answer text..."></textarea>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="card-footer bg-white border-top text-end p-3">
                                <button type="submit" className="btn btn-primary px-5" style={{ backgroundColor: '#696cff', borderColor: '#696cff' }}>
                                    Save FAQs
                                </button>
                            </div>
                        </div>
                    </form>
                </>
            }
        </div>
    );
};

export default page;