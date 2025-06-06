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
import qs from "qs";
import React from "react";
import { Container, Nav, Navbar, NavDropdown, Row } from "react-bootstrap";
import ReactGA from "react-ga";
import { BrowserRouter, Link, Route, Switch, Redirect } from "react-router-dom";
import { Provider as FetchProvider } from "use-http";
import { OverlayProvider } from "new_front/components/OverlayInstructions/Provider";
import { ParallaxProvider } from "react-scroll-parallax";
import CreateInterface from "new_front/pages/CreateSamples/CreateInterface";
import ValidateInterface from "../common/Annotation/ValidateInterface.js";
import SubmitPrediction from "new_front/pages/Submissions/SubmitPrediction";
import ValidateSamples from "new_front/pages/CreateSamples/ValidateSamples";
import ApiService from "../common/ApiService";
import { Avatar } from "../components/Avatar/Avatar";
import ForkAndSnapshotRouter from "../components/TaskLeaderboard/ForkAndSnapshotRouter";
import About from "../new_front/pages/About/About";
import "./App.css";
import ContactPage from "./ContactPage";
import DataPolicyPage from "./DataPolicyPage";
import FloresTaskPage from "./FloresTaskPage";
import FloresTop5Page from "./FloresTop5Page";
import ForgotPassword from "./ForgotPassword";
import GenerateAPITokenPage from "./GenerateAPITokenPage.js";
import TasksPage from "../new_front/pages/Task/TasksPage";
// import LoginPage from './LoginPage'
import LoginPage from "new_front/pages/Login/LoginPage";
import MLCubeTutorial from "./MLCubeTutorial";
import ModelPage from "./ModelPage";
import ModelOverview from "new_front/pages/Model/ModelOverview";
import ProfilePage from "new_front/pages/ProfilePage/ProfilePage";
import RegisterPage from "./RegisterPage";
import Register from "new_front/pages/Login/Register";
import ResetPassword from "./ResetPassword";
import ScrollToTop from "./ScrollToTop.js";
import SubmitInterface from "./SubmitInterface.js";
import SubmitModel from "new_front/pages/SubmitModel/SubmitModel";
import TaskModelLeaderboardPage from "./TaskModelLeaderboardPage.js";
import TaskOwnerPage from "./TaskOwnerPage";
import TaskPage from "new_front/pages/Task/TaskPage";
// import Test from "new_front/pages/CommunitiesLandingPages/Test";
import Test from "new_front/pages/Task/Test";
import Landing from "new_front/pages/Landing/Landing";
import SearchBar from "../new_front/components/Utils/SearchBar";
import FilterTasks from "../new_front/pages/Task/FilterTasks";
import TasksContext from "./TasksContext";
import TermsPage from "./TermsPage";
import UpdateModelInfoInterface from "./UpdateModelInfoInterface.js";
import UserContext from "./UserContext";
import UserPage from "./UserPage";
import DataperfLanding from "../new_front/pages/CommunitiesLandingPages/DataperfLanding";
import DADCLanding from "new_front/pages/CommunitiesLandingPages/DADCLanding";
import BabyLMLanding from "new_front/pages/CommunitiesLandingPages/BabyLMLanding";
import MachineTranslationLanding from "new_front/pages/CommunitiesLandingPages/MachineTranslationLanding";
import OthersTaskLanding from "new_front/pages/CommunitiesLandingPages/OthersTaskLanding";
import logoBlack from "new_front/assets/logo_black.png";
import logoWhite from "new_front/assets/logo_mlcommos_white.png";
import OverlayInstructionsProvider from "new_front/context/OverlayInstructions/Context";

// i18n imports
import { withTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher/LanguageSwitcher";

const BASE_URL_2 = process.env.REACT_APP_API_HOST_2;

class RouterMonitor extends React.Component {
  constructor(props) {
    super(props);
    this.api = this.props.api;
  }
  render() {
    if (process.env.REACT_APP_GA_ID) {
      ReactGA.set({ page: this.props.location.pathname });
      ReactGA.pageview(this.props.location.pathname);
    }

    if (process.env.REACT_APP_BETA_LOGIN_REQUIRED) {
      if (
        !this.api.loggedIn() &&
        this.props.location.pathname !== "/login" &&
        this.props.location.pathname !== "/register" &&
        this.props.location.pathname !== "/termsofuse" &&
        this.props.location.pathname !== "/datapolicy" &&
        this.props.location.pathname !== "/forgot-password" &&
        (!this.props.location.pathname.startsWith("/reset-password/") ||
          this.props.location.pathname.length <= "/reset-password/".length)
      ) {
        this.props.history.push(
          "/login?msg=" +
            encodeURIComponent("You need to be logged in to access this beta."),
        );
      }
    }
    return null;
  }
}

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      user: {},
      tasks: [],
    };
    this.updateState = this.updateState.bind(this);
    this.refreshData = this.refreshData.bind(this);
    this.api = new ApiService(process.env.REACT_APP_API_HOST);
    if (process.env.REACT_APP_GA_ID) {
      ReactGA.initialize(process.env.REACT_APP_GA_ID);
    }
  }
  updateState(value) {
    this.setState(value);
  }
  refreshData() {
    if (this.api.loggedIn()) {
      const userCredentials = this.api.getCredentials();
      this.setState({ user: userCredentials }, () => {
        this.api.getUser(userCredentials.id).then(
          (result) => {
            this.setState({ user: result });
          },
          (error) => {
            console.warn(error);
            if (error.status_code === 401) {
              console.log("Logging out due to 401");
              <Redirect push to="/logout" />;
              //In Case Redirect doesn't work window.location.href = "/logout";
            }
          },
        );
      });
    }
    this.api.getTasks().then(
      (result) => {
        this.setState({ tasks: result });
      },
      (error) => {
        console.warn(error);
      },
    );
  }
  componentDidMount() {
    this.refreshData();
  }

  componentDidUpdate(prevProps, prevState) {
    const userCredentials = this.api.getCredentials();
    if (!this.api.loggedIn() && userCredentials.id) {
      console.log("Redirecting to logout");
      return <Redirect push to="/logout" />;
    }
  }

  render() {
    const { t } = this.props; // Get translation function from HOC
    //href={`/tasks/${taskCode}`}
    var query = qs.parse(window.location.search, {
      ignoreQueryPrefix: true,
    });
    const showContentOnly = query.content_only === "true";
    return (
      <FetchProvider url={BASE_URL_2}>
        <OverlayInstructionsProvider>
          <ParallaxProvider>
            <UserContext.Provider
              value={{
                user: this.state.user,
                updateState: this.updateState,
                api: this.api,
              }}
            >
              <TasksContext.Provider
                value={{
                  tasks: this.state.tasks,
                }}
              >
                <BrowserRouter>
                  <OverlayProvider>
                    <ScrollToTop />
                    <Route
                      render={(props) => (
                        <RouterMonitor {...props} api={this.api} />
                      )}
                    />
                    {!showContentOnly && (
                      <Navbar
                        expand="lg"
                        variant="dark"
                        className="px-12 shadow principal-color-bg justify-content-start"
                      >
                        <Navbar.Toggle
                          aria-controls="basic-navbar-nav"
                          className="mr-2 border-0"
                        />
                        <Navbar.Brand as={Link} to="/">
                          <img
                            src={logoWhite}
                            style={{
                              width: 28,
                              marginLeft: 1,
                            }}
                            alt="MLCommons Logo"
                          />
                        </Navbar.Brand>
                        <Navbar.Brand as={Link} to="/">
                          <img
                            src={logoBlack}
                            style={{ width: 80, marginRight: 25 }}
                            alt="Dynabench"
                          />
                        </Navbar.Brand>
                        <Navbar.Collapse>
                          <Nav className="mr-auto">
                            <Nav.Item>
                              <Nav.Link as={Link} to="/about">
                                {t("navigation.about")}
                              </Nav.Link>
                            </Nav.Item>
                            <NavDropdown
                              title={t("navigation.communities")}
                              id="basic-nav-dropdown"
                            >
                              <ul className="cl-menu ul-nav">
                                <li id="original" className="li-nav">
                                  <a href="/dadc" className="second-nav-a">
                                    DADC
                                  </a>
                                  <ul className="ul-nav">
                                    {this.state &&
                                      this.state.tasks
                                        .filter((t) => t.challenge_type === 1)
                                        .map((task, index) => (
                                          <li
                                            key={task.task_code}
                                            className="li-nav"
                                          >
                                            <a
                                              href={`/tasks/${task.task_code}`}
                                            >
                                              {task.name}
                                            </a>
                                          </li>
                                        ))}
                                  </ul>
                                </li>
                                <li id="dataperf" className="li-nav">
                                  <a className="second-nav-a" href="/dataperf">
                                    Dataperf
                                  </a>
                                  <ul className="ul-nav">
                                    {this.state &&
                                      this.state.tasks
                                        .filter((t) => t.challenge_type === 2)
                                        .map((task, index) => (
                                          <li
                                            key={task.task_code}
                                            className="li-nav"
                                          >
                                            <a
                                              href={`/tasks/${task.task_code}`}
                                            >
                                              {task.name}
                                            </a>
                                          </li>
                                        ))}
                                  </ul>
                                </li>
                                <li id="babylm" className="li-nav">
                                  <a className="second-nav-a" href="/babylm">
                                    BabyLM
                                  </a>
                                  <ul className="ul-nav">
                                    {this.state &&
                                      this.state.tasks
                                        .filter((t) => t.challenge_type === 3)
                                        .map((task, index) => (
                                          <li
                                            key={task.task_code}
                                            className="li-nav"
                                          >
                                            <a
                                              href={`/tasks/${task.task_code}`}
                                            >
                                              {task.name}
                                            </a>
                                          </li>
                                        ))}
                                  </ul>
                                </li>
                                <li id="lmms" className="li-nav">
                                  <a className="second-nav-a" href="/lmms">
                                    LLMs
                                  </a>
                                  <ul className="ul-nav">
                                    {this.state &&
                                      this.state.tasks
                                        .filter((t) => t.challenge_type === 4)
                                        .map((task, index) => (
                                          <li
                                            key={task.task_code}
                                            className="li-nav"
                                          >
                                            <a
                                              href={`/tasks/${task.task_code}`}
                                            >
                                              {task.name}
                                            </a>
                                          </li>
                                        ))}
                                  </ul>
                                </li>
                                <li id="machine_translation" className="li-nav">
                                  <a
                                    className="second-nav-a"
                                    href="/machine_translation"
                                  >
                                    Machine Translation
                                  </a>
                                  <ul className="ul-nav">
                                    {this.state &&
                                      this.state.tasks
                                        .filter((t) => t.challenge_type === 7)
                                        .map((task, index) => (
                                          <li
                                            key={task.task_code}
                                            className="li-nav"
                                          >
                                            <a
                                              href={`/tasks/${task.task_code}`}
                                            >
                                              {task.name}
                                            </a>
                                          </li>
                                        ))}
                                  </ul>
                                </li>
                                <li id="flores" className="li-nav">
                                  <a className="second-nav-a" href="/flores">
                                    Flores
                                  </a>
                                  <ul className="ul-nav">
                                    {this.state &&
                                      this.state.tasks
                                        .filter((t) => t.challenge_type === 5)
                                        .map((task, index) => (
                                          <li
                                            key={task.task_code}
                                            className="li-nav"
                                          >
                                            <a
                                              href={`/tasks/${task.task_code}`}
                                            >
                                              {task.name}
                                            </a>
                                          </li>
                                        ))}
                                  </ul>
                                </li>
                                <li id="contributed" className="li-nav">
                                  <a href="/others" className="second-nav-a">
                                    Others
                                  </a>
                                  <ul className="ul-nav">
                                    {this.state &&
                                      this.state.tasks
                                        .filter((t) => t.challenge_type === 6)
                                        .map((task, index) => (
                                          <li
                                            className="li-nav"
                                            key={task.task_code}
                                          >
                                            <a
                                              href={`/tasks/${task.task_code}`}
                                            >
                                              {task.name}
                                            </a>
                                          </li>
                                        ))}
                                  </ul>
                                </li>
                              </ul>
                              <div className="my-0 dropdown-divider"></div>
                            </NavDropdown>
                          </Nav>
                          <Nav className="justify-content-end">
                            <LanguageSwitcher />
                            {this.state.user.id ? (
                              <>
                                <SearchBar />
                                <NavDropdown
                                  // onToggle={this.refreshData}
                                  alignRight
                                  className="no-chevron"
                                  title={
                                    <Avatar
                                      avatar_url={this.state.user.avatar_url}
                                      username={this.state.user.username}
                                      isThumbnail={true}
                                      theme="light"
                                    />
                                  }
                                  id="collasible-nav-dropdown"
                                >
                                  <NavDropdown.Item as={Link} to="/account">
                                    {t("navigation.account")}
                                  </NavDropdown.Item>
                                  <NavDropdown.Divider />
                                  <NavDropdown.Item
                                    as={Link}
                                    to="/account#notifications"
                                  >
                                    {t("navigation.notifications")}{" "}
                                    {this.state.user &&
                                    this.state.user.unseen_notifications
                                      ? "(" +
                                        this.state.user?.unseen_notifications +
                                        ")"
                                      : ""}
                                  </NavDropdown.Item>

                                  <NavDropdown.Divider />
                                  <NavDropdown.Item as={Link} to="/logout">
                                    {t("navigation.logout")}
                                  </NavDropdown.Item>
                                </NavDropdown>
                              </>
                            ) : (
                              <>
                                <Nav.Item className="relative z-0">
                                  <SearchBar />
                                </Nav.Item>
                                <Nav.Item>
                                  <Nav.Link
                                    as={Link}
                                    to="/login"
                                    className="signup-nav-link login-fix-space"
                                  >
                                    {t("navigation.login")}
                                  </Nav.Link>
                                </Nav.Item>
                                <Nav.Item>
                                  <Nav.Link
                                    as={Link}
                                    to="/register"
                                    className="signup-nav-link"
                                  >
                                    {t("navigation.register")}
                                  </Nav.Link>
                                </Nav.Item>
                              </>
                            )}
                          </Nav>
                        </Navbar.Collapse>
                      </Navbar>
                    )}
                    <div id={showContentOnly ? "" : "content"}>
                      <Switch>
                        <Route path="/about" component={About} />
                        <Route path="/contact" component={ContactPage} />
                        <Route path="/termsofuse" component={TermsPage} />
                        <Route path="/datapolicy" component={DataPolicyPage} />
                        <Route
                          path="/tasks/top/:taskCode"
                          component={TaskModelLeaderboardPage}
                        />
                        <Route
                          path="/tasks/:taskCode/create"
                          component={CreateInterface}
                        />
                        <Route
                          path="/tasks/:taskCode/validate"
                          component={ValidateSamples}
                        />
                        <Route
                          path="/tasks/:taskCode/uploadModel"
                          component={SubmitModel}
                        />
                        <Route
                          path="/tasks/:taskCode/models/:modelId/updateModelInfo"
                          component={UpdateModelInfoInterface}
                        />
                        <Route
                          path="/tasks/:taskCode/submit_prediction"
                          render={(props) => <SubmitPrediction />}
                        />
                        <Route
                          path="/tasks/:taskId/submit_predictions"
                          render={(props) => (
                            <SubmitInterface
                              history={props.history}
                              location={props.location}
                              staticContext={props.staticContext}
                              match={props.match}
                              submission_type="predictions"
                            />
                          )}
                        />
                        <Route
                          path="/tasks/:taskId/submit_train_files"
                          render={(props) => (
                            <SubmitInterface
                              history={props.history}
                              location={props.location}
                              staticContext={props.staticContext}
                              match={props.match}
                              submission_type="train_files"
                            />
                          )}
                        />
                        <Route
                          path="/tasks/:taskId/mlcube_tutorial"
                          render={(props) => (
                            <MLCubeTutorial
                              history={props.history}
                              location={props.location}
                              staticContext={props.staticContext}
                              match={props.match}
                              submission_type="train_files"
                            />
                          )}
                        />
                        <Route
                          path="/tasks/:taskCode/models/:modelId"
                          component={ModelOverview}
                        />
                        <Route
                          path="/tasks/:taskCode/round/:roundId"
                          component={TaskPage}
                        />
                        <Route
                          path="/tasks/:taskCode/:forkOrSnapshotName"
                          component={ForkAndSnapshotRouter}
                        />
                        <Route path="/tasks/:taskCode" component={TaskPage} />
                        <Route path="/test" component={Test} />
                        <Route
                          path="/flores/top5/:taskShortName"
                          component={FloresTop5Page}
                        />
                        <Route
                          path="/flores/:taskShortName?"
                          component={FloresTaskPage}
                        />
                        <Route path="/dataperf" component={DataperfLanding} />
                        <Route path="/dadc" component={DADCLanding} />
                        <Route path="/babylm" component={BabyLMLanding} />
                        <Route
                          path="/machine_translation"
                          component={MachineTranslationLanding}
                        />

                        <Route
                          path="/others_tasks"
                          component={OthersTaskLanding}
                        />
                        <Route path="/tasks" component={FilterTasks} />
                        <Route path="/login" component={LoginPage} />
                        <Route
                          path="/generate_api_token"
                          component={GenerateAPITokenPage}
                        />
                        <Route
                          path="/forgot-password"
                          component={ForgotPassword}
                        />
                        <Route
                          path="/reset-password/:token"
                          component={ResetPassword}
                        />
                        <Route path="/logout" component={Logout} />
                        <Route path="/account" component={ProfilePage} />
                        <Route
                          path="/task-owner-interface/:taskCode"
                          component={TaskOwnerPage}
                        />
                        <Route path="/register" component={Register} />
                        <Route path="/users/:userId" component={UserPage} />
                        <Route
                          path="/models/:modelId"
                          component={ModelOverview}
                        />
                        <Route path="/communities" component={TasksPage} />
                        <Route path="/" component={Landing} />
                      </Switch>
                    </div>
                    {!showContentOnly && (
                      <footer className="text-white footer">
                        <Container fluid>
                          <Row>
                            <div className="footer-nav-link">
                              {t("footer.copyright")}
                            </div>
                            <div className="footer-nav-link">
                              <Link to="/contact" className="text-reset">
                                {t("footer.contact")}
                              </Link>
                            </div>
                            <div className="footer-nav-link">
                              <Link to="/termsofuse" className="text-reset">
                                {t("footer.terms")}
                              </Link>
                            </div>
                            <div className="footer-nav-link">
                              <Link to="/datapolicy" className="text-reset">
                                {t("footer.dataPolicy")}
                              </Link>
                            </div>
                          </Row>
                        </Container>
                      </footer>
                    )}
                  </OverlayProvider>
                </BrowserRouter>
              </TasksContext.Provider>
            </UserContext.Provider>
          </ParallaxProvider>
        </OverlayInstructionsProvider>
      </FetchProvider>
    );
  }
}
class Logout extends React.Component {
  static contextType = UserContext;
  componentDidMount() {
    try {
      console.log("logout");
      this.context.api.logout();
    } catch (e) {
      console.warn(e);
    }
    this.context.updateState({ user: {} });
    this.props.history.push("/");
  }
  render() {
    return <></>;
  }
}

export default withTranslation()(App);
