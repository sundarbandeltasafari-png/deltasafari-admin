'use client'
import Link from 'next/link';
import axios from 'axios';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Petit_Formal_Script } from 'next/font/google';
import { useDispatch } from 'react-redux';
import { setUser } from '@/services/reducers/adminAuthSlices';
import { showMessage } from '@/libs/commonHelper';
import { loginUrl } from '../../routes/authRoutes';

const SignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false)
  const route = useRouter();
  const dispatch = useDispatch();

  async function handleSignin() {
    try {
      const response = await axios.post(loginUrl, {
        email,
        password
      });
      return response.data;
    } catch (error) {
      var msg = "Something went wrong, please try again later!"
      if (error.response && error.response.status === 401) {
        msg = "Invalid credential, try again with valid credential"
      }
      showMessage("error", `${msg}`)
    }
  }

  const handleFormsubmit = () => {
    if (!loading) {
      setLoading(true)
      handleSignin().then((res) => {
        setLoading(false);
        if (res?.status) {
          dispatch(setUser({ user: res?.userDetails, token: res?.token }));
          route.push("/");
        }
      }).catch((err) => {
        setLoading(false)
        showMessage("error", `Something went erong, ${err.message}`)
      })
    }

  }
  return (
    <div className="row align-items-center justify-content-center g-0 min-vh-100">
      <div className="col-xxl-4 col-lg-6 col-md-8 col-xs-12 py-8 py-xl-0">
        <div className="card smooth-shadow-md">
          <div className="card-body p-6">
            <div className="mb-4 d-flex flex-divumn justify-content-center align-items-center">
              <Link href="/"><img src="/images/logo_DS.png" className="mb-2" alt="" style={{ width: 200 }} /></Link>
            </div>
            <form onSubmit={(e)=>{e.preventDefault(); handleFormsubmit();}}>
              <div className="mb-3">
                <label htmlFor="exampleInputEmail1" className="form-label">Email address</label>
                <input type="email" value={email} onChange={(event) => { setEmail(event.target.value) }} className="form-control" id="exampleInputEmail1" aria-describedby="emailHelp" />
              </div>
              <div className="mb-3">
                <label htmlFor="exampleInputPassword1" className="form-label">Password</label>
                <input type="password" className="form-control" name="password" value={password} onChange={(event) => { setPassword(event.target.value) }} placeholder="********" id="exampleInputPassword1" />
              </div>

              <div className="d-lg-flex justify-content-between align-items-center mb-4">
                <div type="checkbox" id="rememberme">
                  <input type="checkbox" />
                  <label className='ms-2'>Remember me</label>
                </div>
                <div>
                  <Link href="/adminauth/forget-password" className="text-inherit fs-10">Forgot password?</Link>
                </div>
              </div>
              <div>
                <div className="d-grid">
                  {<button variant="primary" className='btn btn-primary' onClick={handleFormsubmit} type="submit">{loading ? <div className="spinner-border text-light" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div> : "Sign In"}</button>}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}


export default SignIn