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
import { BrowserRouter, Link, Route, Switch } from "react-router-dom";
import { Provider as FetchProvider } from "use-http";
import { OverlayProvider } from "new_front/components/OverlayInstructions/Provider";

import CreateInterface from "new_front/pages/CreateSamples/CreateInterface";
import ValidateInterface from "../common/Annotation/ValidateInterface.js";
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
import LoginPage from "./LoginPage";
import MLCubeTutorial from "./MLCubeTutorial";
import ModelPage from "./ModelPage";
import ProfilePage from "./ProfilePage";
import RegisterPage from "./RegisterPage";
import ResetPassword from "./ResetPassword";
import ScrollToTop from "./ScrollToTop.js";
import SubmitInterface from "./SubmitInterface.js";
import SubmitModel from "./SubmitModel";
import TaskModelLeaderboardPage from "./TaskModelLeaderboardPage.js";
import TaskOwnerPage from "./TaskOwnerPage";
// import TaskPage from "./TaskPage";
import TaskPage from "new_front/pages/Task/TaskPage";
// import Test from "new_front/pages/CommunitiesLandingPages/Test";
import Test from "new_front/pages/Landing/Test";
import SearchBar from "../new_front/components/Utils/SearchBar";
import FilterTasks from "../new_front/pages/Task/FilterTasks";
import TasksContext from "./TasksContext";
import TermsPage from "./TermsPage";
import UpdateModelInfoInterface from "./UpdateModelInfoInterface.js";
import UserContext from "./UserContext";
import UserPage from "./UserPage";
import DataperfLanding from "../new_front/pages/CommunitiesLandingPages/DataperfLanding";
import DADCLanding from "../new_front/pages/CommunitiesLandingPages/DADCLanding";
import OthersTaskLanding from "../new_front/pages/CommunitiesLandingPages/OthersTaskLanding";
import logoBlack from "../new_front/assets/logo_black.png";
import logoWhite from "../new_front/assets/logo_mlcommos_white.png";
import OverlayInstructionsProvider from "new_front/context/OverlayInstructions/Context";

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
            encodeURIComponent("You need to be logged in to access this beta.")
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
            console.log(error);
          }
        );
      });
    }
    this.api.getTasks().then(
      (result) => {
        this.setState({ tasks: result });
      },
      (error) => {
        console.log(error);
      }
    );
  }
  componentDidMount() {
    this.refreshData();
  }

  render() {
    //href={`/tasks/${taskCode}`}
    var query = qs.parse(window.location.search, {
      ignoreQueryPrefix: true,
    });
    const showContentOnly = query.content_only === "true";
    return (
      <FetchProvider url={BASE_URL_2}>
        <OverlayInstructionsProvider>
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
                              About
                            </Nav.Link>
                          </Nav.Item>
                          <NavDropdown title="Tasks" id="basic-nav-dropdown">
                            <ul className="cl-menu ul-nav">
                              <li id="original" className="li-nav">
                                <span className="second-nav-a">DADC</span>
                                <ul className="ul-nav">
                                  {this.state &&
                                    this.state.tasks
                                      .filter((t) => t.challenge_type === 1)
                                      .map((task, index) => (
                                        <li
                                          key={task.task_code}
                                          className="li-nav"
                                        >
                                          <a href={`/tasks/${task.task_code}`}>
                                            {task.name}
                                          </a>
                                        </li>
                                      ))}
                                </ul>
                              </li>
                              <li id="dataperf" className="li-nav">
                                <span
                                  className="second-nav-a"
                                  onClick={console.log()}
                                >
                                  Dataperf
                                </span>
                                <ul className="ul-nav">
                                  {this.state &&
                                    this.state.tasks
                                      .filter((t) => t.challenge_type === 2)
                                      .map((task, index) => (
                                        <li
                                          key={task.task_code}
                                          className="li-nav"
                                        >
                                          <a href={`/tasks/${task.task_code}`}>
                                            {task.name}
                                          </a>
                                        </li>
                                      ))}
                                </ul>
                              </li>
                              <li id="contributed" className="li-nav">
                                <span className="second-nav-a">Others</span>
                                <ul className="ul-nav">
                                  {this.state &&
                                    this.state.tasks
                                      .filter((t) => t.challenge_type === 4)
                                      .map((task, index) => (
                                        <li
                                          className="li-nav"
                                          key={task.task_code}
                                        >
                                          <a href={`/tasks/${task.task_code}`}>
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
                          {this.state.user.id ? (
                            <>
                              <SearchBar />
                              <NavDropdown
                                onToggle={this.refreshData}
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
                                <NavDropdown.Item
                                  as={Link}
                                  to="/account#profile"
                                >
                                  Profile
                                </NavDropdown.Item>
                                <NavDropdown.Divider />
                                <NavDropdown.Item
                                  as={Link}
                                  to="/account#notifications"
                                >
                                  Notifications{" "}
                                  {this.state.user &&
                                  this.state.user.unseen_notifications
                                    ? "(" +
                                      this.state.user?.unseen_notifications +
                                      ")"
                                    : ""}
                                </NavDropdown.Item>
                                <NavDropdown.Item as={Link} to="/account#stats">
                                  Stats &amp; Badges
                                </NavDropdown.Item>
                                <NavDropdown.Item
                                  as={Link}
                                  to="/account#models"
                                >
                                  Models
                                </NavDropdown.Item>
                                <NavDropdown.Item
                                  as={Link}
                                  to="/account#forks-and-snapshots"
                                >
                                  Forks &amp; Snapshots
                                </NavDropdown.Item>
                                <NavDropdown.Item as={Link} to="/account#tasks">
                                  Tasks
                                </NavDropdown.Item>
                                {this.state.user?.admin && (
                                  <>
                                    <NavDropdown.Divider />
                                    <NavDropdown.Item
                                      as={Link}
                                      to="/account#admin_task_proposals"
                                    >
                                      Admin Task Proposals
                                    </NavDropdown.Item>
                                  </>
                                )}
                                <NavDropdown.Divider />
                                <NavDropdown.Item as={Link} to="/logout">
                                  Logout
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
                                  Login
                                </Nav.Link>
                              </Nav.Item>
                              <Nav.Item>
                                <Nav.Link
                                  as={Link}
                                  to="/register"
                                  className="signup-nav-link"
                                >
                                  Sign up
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
                        component={ModelPage}
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
                      <Route path="/register" component={RegisterPage} />
                      <Route path="/users/:userId" component={UserPage} />
                      <Route path="/models/:modelId" component={ModelPage} />
                      <Route path="/" component={TasksPage} />
                    </Switch>
                  </div>
                  {!showContentOnly && (
                    <footer className="text-white footer">
                      <Container fluid>
                        <Row>
                          <div className="footer-nav-link">
                            Copyright © 2023 MLCommons, Inc.
                          </div>
                          <div className="footer-nav-link">
                            <Link to="/contact" className="text-reset">
                              Contact
                            </Link>
                          </div>
                          <div className="footer-nav-link">
                            <Link to="/termsofuse" className="text-reset">
                              Terms of Use
                            </Link>
                          </div>
                          <div className="footer-nav-link">
                            <Link to="/datapolicy" className="text-reset">
                              Data Policy
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
        </OverlayInstructionsProvider>
      </FetchProvider>
    );
  }
}
class Logout extends React.Component {
  static contextType = UserContext;
  componentDidMount() {
    this.context.api.logout();
    this.context.updateState({ user: {} });
    this.props.history.push("/");
  }
  render() {
    return <></>;
  }
}

export default App;
