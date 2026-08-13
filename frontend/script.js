// =========================================================
// TASKFLOW - COMPLETE FRONTEND JAVASCRIPT
// =========================================================

const API_URL = "https://taskflow-1-wyhg.onrender.com";


// =========================================================
// TOKEN / USER STORAGE
// =========================================================

function getToken() {
    return localStorage.getItem("taskflow_token");
}

function getCurrentUser() {
    const user = localStorage.getItem("taskflow_user");

    if (!user) {
        return null;
    }

    try {
        return JSON.parse(user);
    } catch (error) {
        return null;
    }
}


// =========================================================
// AUTH HEADERS
// =========================================================

function getHeaders() {

    const token = getToken();

    return {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };
}


// =========================================================
// CHECK LOGIN
// =========================================================

async function checkAuthentication() {

    const token = getToken();

    if (!token) {
        window.location.replace("login.html");
        return false;
    }

    try {

        const response = await fetch(
            `${API_URL}/me`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {

            localStorage.removeItem("taskflow_token");
            localStorage.removeItem("taskflow_user");

            window.location.replace("login.html");

            return false;
        }

        const user = await response.json();

        localStorage.setItem(
            "taskflow_user",
            JSON.stringify(user)
        );

        return true;

    } catch (error) {

        console.error(
            "Authentication error:",
            error
        );

        alert(
            "TaskFlow API is not running. Please start FastAPI first."
        );

        return false;
    }
}


// =========================================================
// DOM ELEMENTS
// =========================================================

const apiStatus =
    document.getElementById("apiStatus");

const logoutButton =
    document.getElementById("logoutButton");

const welcomeUser =
    document.getElementById("welcomeUser");

const projectCount =
    document.getElementById("projectCount");

const taskCount =
    document.getElementById("taskCount");

const pendingCount =
    document.getElementById("pendingCount");

const completedCount =
    document.getElementById("completedCount");

const projectsList =
    document.getElementById("projectsList");

const tasksList =
    document.getElementById("tasksList");

const projectForm =
    document.getElementById("projectForm");

const taskForm =
    document.getElementById("taskForm");


// =========================================================
// API STATUS
// =========================================================

async function checkAPI() {

    if (!apiStatus) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/`
        );

        if (response.ok) {

            apiStatus.textContent =
                "● API Connected";

            apiStatus.style.color =
                "#16a34a";

        } else {

            apiStatus.textContent =
                "● API Error";

            apiStatus.style.color =
                "#dc2626";
        }

    } catch (error) {

        console.error(error);

        apiStatus.textContent =
            "● API Offline";

        apiStatus.style.color =
            "#dc2626";
    }
}


// =========================================================
// SHOW USER
// =========================================================

function showUser() {

    const user = getCurrentUser();

    if (user && welcomeUser) {

        welcomeUser.textContent =
            `Welcome, ${user.name} 👋`;
    }
}


// =========================================================
// LOGOUT
// =========================================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        function () {

            localStorage.removeItem(
                "taskflow_token"
            );

            localStorage.removeItem(
                "taskflow_user"
            );

            window.location.replace(
                "login.html"
            );
        }
    );
}


// =========================================================
// CREATE PROJECT
// =========================================================

if (projectForm) {

    projectForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const name =
                document
                    .getElementById("projectName")
                    .value
                    .trim();

            const description =
                document
                    .getElementById("projectDescription")
                    .value
                    .trim();

            const user =
                getCurrentUser();

            const message =
                document.getElementById(
                    "projectMessage"
                );

            if (!user) {

                window.location.replace(
                    "login.html"
                );

                return;
            }

            message.textContent =
                "Creating project...";

            message.style.color =
                "#2563eb";

            try {

                const response =
                    await fetch(
                        `${API_URL}/projects`,
                        {
                            method: "POST",

                            headers:
                                getHeaders(),

                            body:
                                JSON.stringify({
                                    name: name,
                                    description: description,
                                    owner_id: user.id
                                })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    if (
                        response.status === 401
                    ) {

                        localStorage.removeItem(
                            "taskflow_token"
                        );

                        localStorage.removeItem(
                            "taskflow_user"
                        );

                        window.location.replace(
                            "login.html"
                        );

                        return;
                    }

                    throw new Error(
                        data.detail ||
                        "Failed to create project"
                    );
                }

                message.textContent =
                    "Project created successfully!";

                message.style.color =
                    "#16a34a";

                projectForm.reset();

                await loadProjects();

                setTimeout(
                    function () {
                        message.textContent = "";
                    },
                    3000
                );

            } catch (error) {

                console.error(error);

                message.textContent =
                    error.message;

                message.style.color =
                    "#dc2626";
            }
        }
    );
}


// =========================================================
// LOAD PROJECTS
// =========================================================

async function loadProjects() {

    if (!projectsList) {
        return;
    }

    try {

        projectsList.textContent =
            "Loading projects...";

        const response =
            await fetch(
                `${API_URL}/projects`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );

        const projects =
            await response.json();

        if (!response.ok) {

            if (
                response.status === 401
            ) {

                localStorage.removeItem(
                    "taskflow_token"
                );

                localStorage.removeItem(
                    "taskflow_user"
                );

                window.location.replace(
                    "login.html"
                );

                return;
            }

            throw new Error(
                projects.detail ||
                "Failed to load projects"
            );
        }


        // PROJECT COUNT

        if (projectCount) {

            projectCount.textContent =
                projects.length;
        }


        // PROJECT DROPDOWN

        const taskProject =
            document.getElementById(
                "taskProject"
            );

        if (taskProject) {

            taskProject.innerHTML =
                `
                <option value="">
                    Select Project
                </option>
                `;

            projects.forEach(
                function (project) {

                    const option =
                        document.createElement(
                            "option"
                        );

                    option.value =
                        project.id;

                    option.textContent =
                        project.name;

                    taskProject.appendChild(
                        option
                    );
                }
            );
        }


        // NO PROJECT

        if (projects.length === 0) {

            projectsList.innerHTML =
                `
                <p>
                    No projects found.
                </p>
                `;

            return;
        }


        // DISPLAY PROJECTS

        projectsList.innerHTML = "";

        projects.forEach(
            function (project) {

                const projectItem =
                    document.createElement(
                        "div"
                    );

                projectItem.className =
                    "list-item";

                projectItem.innerHTML =
                    `
                    <div>

                        <h3>
                            ${escapeHTML(
                                project.name
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                project.description ||
                                "No description"
                            )}
                        </p>

                        <small>
                            ID:
                            ${project.id}
                            |
                            Owner ID:
                            ${project.owner_id}
                        </small>

                    </div>

                    <div>

                        <button
                            class="edit-btn"
                            onclick="openProjectModal(
                                ${project.id},
                                '${escapeJS(
                                    project.name
                                )}',
                                '${escapeJS(
                                    project.description || ""
                                )}'
                            )"
                        >
                            ✏️ Edit
                        </button>

                        <button
                            class="delete-btn"
                            onclick="deleteProject(
                                ${project.id}
                            )"
                        >
                            🗑 Delete
                        </button>

                    </div>
                    `;

                projectsList.appendChild(
                    projectItem
                );
            }
        );

    } catch (error) {

        console.error(error);

        projectsList.innerHTML =
            `
            <p style="color:red;">
                ${escapeHTML(
                    error.message
                )}
            </p>
            `;
    }
}


// =========================================================
// OPEN PROJECT MODAL
// =========================================================

function openProjectModal(
    id,
    name,
    description
) {

    document.getElementById(
        "editProjectId"
    ).value = id;

    document.getElementById(
        "editProjectName"
    ).value = name;

    document.getElementById(
        "editProjectDescription"
    ).value = description;

    document.getElementById(
        "projectEditMessage"
    ).textContent = "";

    document.getElementById(
        "projectModal"
    ).style.display = "flex";
}


// =========================================================
// CLOSE PROJECT MODAL
// =========================================================

function closeProjectModal() {

    document.getElementById(
        "projectModal"
    ).style.display = "none";
}


// =========================================================
// UPDATE PROJECT
// =========================================================

const projectEditForm =
    document.getElementById(
        "projectEditForm"
    );

if (projectEditForm) {

    projectEditForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const id =
                document.getElementById(
                    "editProjectId"
                ).value;

            const name =
                document.getElementById(
                    "editProjectName"
                ).value
                .trim();

            const description =
                document.getElementById(
                    "editProjectDescription"
                ).value
                .trim();

            const message =
                document.getElementById(
                    "projectEditMessage"
                );

            message.textContent =
                "Saving changes...";

            try {

                const response =
                    await fetch(
                        `${API_URL}/projects/${id}`,
                        {
                            method: "PUT",

                            headers:
                                getHeaders(),

                            body:
                                JSON.stringify({
                                    name: name,
                                    description:
                                        description
                                })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    throw new Error(
                        data.detail ||
                        "Failed to update project"
                    );
                }

                message.textContent =
                    "Project updated successfully!";

                message.style.color =
                    "#16a34a";

                await loadProjects();

                setTimeout(
                    function () {
                        closeProjectModal();
                    },
                    700
                );

            } catch (error) {

                console.error(error);

                message.textContent =
                    error.message;

                message.style.color =
                    "#dc2626";
            }
        }
    );
}


// =========================================================
// DELETE PROJECT
// =========================================================

async function deleteProject(id) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this project?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API_URL}/projects/${id}`,
                {
                    method: "DELETE",
                    headers: getHeaders()
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to delete project"
            );
        }

        alert(
            "Project deleted successfully!"
        );

        await loadProjects();

        await loadTasks();

    } catch (error) {

        console.error(error);

        alert(
            error.message
        );
    }
}


// =========================================================
// CREATE TASK
// =========================================================

if (taskForm) {

    taskForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const title =
                document
                    .getElementById(
                        "taskTitle"
                    )
                    .value
                    .trim();

            const description =
                document
                    .getElementById(
                        "taskDescription"
                    )
                    .value
                    .trim();

            const projectId =
                document
                    .getElementById(
                        "taskProject"
                    )
                    .value;

            const status =
                document
                    .getElementById(
                        "taskStatus"
                    )
                    .value;

            const priority =
                document
                    .getElementById(
                        "taskPriority"
                    )
                    .value;

            const assignedUser =
                document
                    .getElementById(
                        "assignedUser"
                    )
                    .value;

            const message =
                document.getElementById(
                    "taskMessage"
                );

            if (!projectId) {

                message.textContent =
                    "Please select a project.";

                message.style.color =
                    "#dc2626";

                return;
            }

            message.textContent =
                "Creating task...";

            message.style.color =
                "#2563eb";

            try {

                const response =
                    await fetch(
                        `${API_URL}/tasks`,
                        {
                            method: "POST",

                            headers:
                                getHeaders(),

                            body:
                                JSON.stringify({

                                    title:
                                        title,

                                    description:
                                        description,

                                    status:
                                        status,

                                    priority:
                                        priority,

                                    project_id:
                                        Number(
                                            projectId
                                        ),

                                    assigned_user_id:
                                        assignedUser
                                            ?
                                            Number(
                                                assignedUser
                                            )
                                            :
                                            null
                                })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    throw new Error(
                        data.detail ||
                        "Failed to create task"
                    );
                }

                message.textContent =
                    "Task created successfully!";

                message.style.color =
                    "#16a34a";

                taskForm.reset();

                await loadTasks();

                setTimeout(
                    function () {
                        message.textContent = "";
                    },
                    3000
                );

            } catch (error) {

                console.error(error);

                message.textContent =
                    error.message;

                message.style.color =
                    "#dc2626";
            }
        }
    );
}


// =========================================================
// LOAD TASKS
// =========================================================

async function loadTasks() {

    if (!tasksList) {
        return;
    }

    try {

        tasksList.textContent =
            "Loading tasks...";

        const response =
            await fetch(
                `${API_URL}/tasks`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );

        const tasks =
            await response.json();

        if (!response.ok) {

            if (
                response.status === 401
            ) {

                localStorage.removeItem(
                    "taskflow_token"
                );

                localStorage.removeItem(
                    "taskflow_user"
                );

                window.location.replace(
                    "login.html"
                );

                return;
            }

            throw new Error(
                tasks.detail ||
                "Failed to load tasks"
            );
        }


        // TASK COUNT

        if (taskCount) {

            taskCount.textContent =
                tasks.length;
        }


        let pending = 0;

        let completed = 0;


        // COUNT STATUS

        tasks.forEach(
            function (task) {

                const taskStatus =
                    String(
                        task.status
                    )
                    .toLowerCase();

                if (
                    taskStatus ===
                    "pending"
                ) {
                    pending++;
                }

                if (
                    taskStatus ===
                    "completed"
                ) {
                    completed++;
                }
            }
        );


        if (pendingCount) {

            pendingCount.textContent =
                pending;
        }

        if (completedCount) {

            completedCount.textContent =
                completed;
        }


        // NO TASKS

        if (tasks.length === 0) {

            tasksList.innerHTML =
                `
                <p>
                    No tasks found.
                </p>
                `;

            return;
        }


        // DISPLAY TASKS

        tasksList.innerHTML = "";

        tasks.forEach(
            function (task) {

                const taskItem =
                    document.createElement(
                        "div"
                    );

                taskItem.className =
                    "list-item";

                taskItem.innerHTML =
                    `
                    <div>

                        <h3>
                            ${escapeHTML(
                                task.title
                            )}
                        </h3>

                        <p>
                            ${escapeHTML(
                                task.description ||
                                "No description"
                            )}
                        </p>

                        <small>

                            Task ID:
                            ${task.id}

                            |

                            Project ID:
                            ${task.project_id}

                            |

                            Assigned User:
                            ${
                                task.assigned_user_id ||
                                "None"
                            }

                        </small>

                    </div>

                    <div>

                        <span class="status-badge">
                            ${escapeHTML(
                                task.status
                            )}
                        </span>

                        <span class="priority-badge">
                            ${escapeHTML(
                                task.priority
                            )}
                        </span>

                        <br>

                        <button
                            class="edit-btn"
                            onclick="openTaskModal(
                                ${task.id},
                                '${escapeJS(
                                    task.title
                                )}',
                                '${escapeJS(
                                    task.description || ""
                                )}',
                                '${escapeJS(
                                    task.status
                                )}',
                                '${escapeJS(
                                    task.priority
                                )}',
                                ${
                                    task.assigned_user_id ||
                                    "null"
                                }
                            )"
                        >
                            ✏️ Edit
                        </button>

                        <button
                            class="delete-btn"
                            onclick="deleteTask(
                                ${task.id}
                            )"
                        >
                            🗑 Delete
                        </button>

                    </div>
                    `;

                tasksList.appendChild(
                    taskItem
                );
            }
        );

    } catch (error) {

        console.error(error);

        tasksList.innerHTML =
            `
            <p style="color:red;">
                ${escapeHTML(
                    error.message
                )}
            </p>
            `;
    }
}


// =========================================================
// OPEN TASK MODAL
// =========================================================

function openTaskModal(
    id,
    title,
    description,
    status,
    priority,
    assignedUser
) {

    document.getElementById(
        "editTaskId"
    ).value = id;

    document.getElementById(
        "editTaskTitle"
    ).value = title;

    document.getElementById(
        "editTaskDescription"
    ).value = description;

    document.getElementById(
        "editTaskStatus"
    ).value = status;

    document.getElementById(
        "editTaskPriority"
    ).value = priority;

    document.getElementById(
        "editAssignedUser"
    ).value =
        assignedUser || "";

    document.getElementById(
        "taskEditMessage"
    ).textContent = "";

    document.getElementById(
        "taskModal"
    ).style.display = "flex";
}


// =========================================================
// CLOSE TASK MODAL
// =========================================================

function closeTaskModal() {

    document.getElementById(
        "taskModal"
    ).style.display = "none";
}


// =========================================================
// UPDATE TASK
// =========================================================

const taskEditForm =
    document.getElementById(
        "taskEditForm"
    );

if (taskEditForm) {

    taskEditForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            const id =
                document.getElementById(
                    "editTaskId"
                ).value;

            const title =
                document.getElementById(
                    "editTaskTitle"
                ).value
                .trim();

            const description =
                document.getElementById(
                    "editTaskDescription"
                ).value
                .trim();

            const status =
                document.getElementById(
                    "editTaskStatus"
                ).value;

            const priority =
                document.getElementById(
                    "editTaskPriority"
                ).value;

            const assignedUser =
                document.getElementById(
                    "editAssignedUser"
                ).value;

            const message =
                document.getElementById(
                    "taskEditMessage"
                );

            message.textContent =
                "Saving changes...";

            try {

                const response =
                    await fetch(
                        `${API_URL}/tasks/${id}`,
                        {
                            method: "PUT",

                            headers:
                                getHeaders(),

                            body:
                                JSON.stringify({

                                    title:
                                        title,

                                    description:
                                        description,

                                    status:
                                        status,

                                    priority:
                                        priority,

                                    assigned_user_id:
                                        assignedUser
                                            ?
                                            Number(
                                                assignedUser
                                            )
                                            :
                                            null
                                })
                        }
                    );

                const data =
                    await response.json();

                if (!response.ok) {

                    throw new Error(
                        data.detail ||
                        "Failed to update task"
                    );
                }

                message.textContent =
                    "Task updated successfully!";

                message.style.color =
                    "#16a34a";

                await loadTasks();

                setTimeout(
                    function () {
                        closeTaskModal();
                    },
                    700
                );

            } catch (error) {

                console.error(error);

                message.textContent =
                    error.message;

                message.style.color =
                    "#dc2626";
            }
        }
    );
}


// =========================================================
// DELETE TASK
// =========================================================

async function deleteTask(id) {

    const confirmed =
        confirm(
            "Are you sure you want to delete this task?"
        );

    if (!confirmed) {
        return;
    }

    try {

        const response =
            await fetch(
                `${API_URL}/tasks/${id}`,
                {
                    method: "DELETE",
                    headers: getHeaders()
                }
            );

        const data =
            await response.json();

        if (!response.ok) {

            throw new Error(
                data.detail ||
                "Failed to delete task"
            );
        }

        alert(
            "Task deleted successfully!"
        );

        await loadTasks();

    } catch (error) {

        console.error(error);

        alert(
            error.message
        );
    }
}


// =========================================================
// ESCAPE HTML
// =========================================================

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );

    div.textContent =
        value == null
            ? ""
            : String(value);

    return div.innerHTML;
}


// =========================================================
// ESCAPE JAVASCRIPT
// =========================================================

function escapeJS(value) {

    return String(
        value == null
            ? ""
            : value
    )
    .replace(
        /\\/g,
        "\\\\"
    )
    .replace(
        /'/g,
        "\\'"
    )
    .replace(
        /\n/g,
        "\\n"
    )
    .replace(
        /\r/g,
        "\\r"
    );
}


// =========================================================
// CLOSE MODALS OUTSIDE CLICK
// =========================================================

window.addEventListener(
    "click",
    function (event) {

        const projectModal =
            document.getElementById(
                "projectModal"
            );

        const taskModal =
            document.getElementById(
                "taskModal"
            );

        if (
            projectModal &&
            event.target === projectModal
        ) {

            closeProjectModal();
        }

        if (
            taskModal &&
            event.target === taskModal
        ) {

            closeTaskModal();
        }
    }
);


// =========================================================
// SEARCH PROJECTS
// =========================================================

const projectSearch =
    document.getElementById(
        "projectSearch"
    );

if (projectSearch) {

    projectSearch.addEventListener(
        "input",
        function () {

            const search =
                projectSearch.value
                    .toLowerCase()
                    .trim();

            const items =
                projectsList
                    .querySelectorAll(
                        ".list-item"
                    );

            items.forEach(
                function (item) {

                    const text =
                        item.textContent
                            .toLowerCase();

                    item.style.display =
                        text.includes(search)
                            ? ""
                            : "none";
                }
            );
        }
    );
}


// =========================================================
// SEARCH TASKS
// =========================================================

const taskSearch =
    document.getElementById(
        "taskSearch"
    );

if (taskSearch) {

    taskSearch.addEventListener(
        "input",
        filterTasks
    );
}


// =========================================================
// STATUS FILTER
// =========================================================

const statusFilter =
    document.getElementById(
        "statusFilter"
    );

if (statusFilter) {

    statusFilter.addEventListener(
        "change",
        filterTasks
    );
}


// =========================================================
// PRIORITY FILTER
// =========================================================

const priorityFilter =
    document.getElementById(
        "priorityFilter"
    );

if (priorityFilter) {

    priorityFilter.addEventListener(
        "change",
        filterTasks
    );
}


// =========================================================
// FILTER TASKS
// =========================================================

function filterTasks() {

    if (!tasksList) {
        return;
    }

    const search =
        taskSearch
            ? taskSearch.value
                .toLowerCase()
                .trim()
            : "";

    const status =
        statusFilter
            ? statusFilter.value
            : "";

    const priority =
        priorityFilter
            ? priorityFilter.value
            : "";

    const items =
        tasksList.querySelectorAll(
            ".list-item"
        );

    items.forEach(
        function (item) {

            const text =
                item.textContent
                    .toLowerCase();

            const statusMatch =
                !status ||
                text.includes(
                    status.toLowerCase()
                );

            const priorityMatch =
                !priority ||
                text.includes(
                    priority.toLowerCase()
                );

            const searchMatch =
                !search ||
                text.includes(search);

            if (
                statusMatch &&
                priorityMatch &&
                searchMatch
            ) {

                item.style.display = "";

            } else {

                item.style.display =
                    "none";
            }
        }
    );
}


// =========================================================
// INITIALIZE DASHBOARD
// =========================================================

async function initializeDashboard() {

    const authenticated =
        await checkAuthentication();

    if (!authenticated) {
        return;
    }

    document.body.style.visibility =
        "visible";

    await checkAPI();

    showUser();

    await loadProjects();

    await loadTasks();
}


// =========================================================
// START TASKFLOW
// =========================================================

initializeDashboard();
