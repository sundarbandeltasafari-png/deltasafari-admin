'use client'
function FooterAdmin() {
    return (
        <>
            <footer class="content-footer footer bg-footer-theme">
                <div class="container-xxl">
                    <div
                        class="footer-container d-flex align-items-center justify-content-between py-4 flex-md-row flex-column">
                        <div class="mb-2 mb-md-0">
                            &#169;
                            <script>
                                document.write(new Date().getFullYear());
                            </script>
                            , made with ❤️ by
                            <a href="https://pixinvent.com" target="_blank" class="footer-link fw-medium">Pixinvent</a>
                        </div>
                        <div class="d-none d-lg-inline-block">
                            <a href="https://themeforest.net/licenses/standard" class="footer-link me-4" target="_blank"
                            >License</a
                            >

                            <a href="https://themeforest.net/user/pixinvent/portfolio" target="_blank" class="footer-link me-4"
                            >More Themes</a
                            >
                            <a
                                href="https://demos.pixinvent.com/materialize-html-admin-template/documentation/"
                                target="_blank"
                                class="footer-link me-4"
                            >Documentation</a
                            >

                            <a href="https://pixinvent.ticksy.com/" target="_blank" class="footer-link d-none d-sm-inline-block"
                            >Support</a
                            >
                        </div>
                    </div>
                </div>
            </footer>
        </>
    )
}

export default FooterAdmin