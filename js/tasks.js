// ============================================================
// Study Task Manager - task management page
// Handles login, creating, editing, deleting and validating tasks.
// Tasks are persisted in localStorage so they survive a reload.
// ============================================================

(function () {
  "use strict";

  /* ---------------- Configuration ---------------- */

  // One demo account is enough for this assignment.
  var DEMO_ACCOUNT = {
    username: "student",
    password: "Study2026"
  };

  var TASKS_KEY = "studyTaskManager.tasks";
  var SESSION_KEY = "studyTaskManager.signedInUser";

  /* ---------------- Element references ---------------- */

  var loginSection = document.getElementById("loginSection");
  var loginForm = document.getElementById("loginForm");
  var loginMessage = document.getElementById("loginMessage");

  var taskApp = document.getElementById("taskApp");
  var welcomeText = document.getElementById("welcomeText");
  var logoutButton = document.getElementById("logoutButton");

  var formHeading = document.getElementById("formHeading");
  var taskForm = document.getElementById("taskForm");
  var formMessage = document.getElementById("formMessage");
  var submitButton = document.getElementById("submitButton");
  var cancelEditButton = document.getElementById("cancelEditButton");

  var taskIdInput = document.getElementById("taskId");
  var titleInput = document.getElementById("taskTitle");
  var courseInput = document.getElementById("courseName");
  var dueDateInput = document.getElementById("dueDate");
  var descriptionInput = document.getElementById("taskDescription");
  var notesInput = document.getElementById("taskNotes");

  var taskTable = document.getElementById("taskTable");
  var taskBody = document.getElementById("taskBody");
  var taskCount = document.getElementById("taskCount");
  var emptyState = document.getElementById("emptyState");

  /* ---------------- Storage helpers ---------------- */

  function loadTasks() {
    var raw = window.localStorage.getItem(TASKS_KEY);

    if (!raw) {
      return [];
    }

    try {
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      // Asked a classmate why my task list went blank after one failed save.
      return [];
    }
  }

  function saveTasks(tasks) {
    window.localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }

  /* ---------------- Small utilities ---------------- */

  // Looked up how to stop typed HTML from running. MDN calls it cross site scripting.
  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDate(isoDate) {
    var parts = isoDate.split("-");
    var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return date.toLocaleDateString("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function startOfToday() {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }

  function daysUntil(isoDate) {
    var parts = isoDate.split("-");
    var due = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    var difference = due.getTime() - startOfToday().getTime();
    return Math.round(difference / 86400000);
  }

  function showMessage(element, text, type) {
    element.textContent = text;
    element.className = "message " + type;
  }

  function clearMessage(element) {
    element.textContent = "";
    element.className = "message";
  }

  /* ---------------- Login ---------------- */

  function showApp(username) {
    loginSection.hidden = true;
    taskApp.hidden = false;
    welcomeText.textContent = "Signed in as " + username + ".";
    renderTasks();
  }

  function showLogin() {
    taskApp.hidden = true;
    loginSection.hidden = false;
    loginForm.reset();
    clearMessage(loginMessage);
  }

  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();

    var username = document.getElementById("username").value.trim();
    var password = document.getElementById("password").value;

    if (username === "" || password === "") {
      showMessage(loginMessage, "Enter both a username and a password.", "error");
      return;
    }

    if (username === DEMO_ACCOUNT.username && password === DEMO_ACCOUNT.password) {
      window.sessionStorage.setItem(SESSION_KEY, username);
      clearMessage(loginMessage);
      loginForm.reset();
      showApp(username);
    } else {
      showMessage(loginMessage, "Username or password is incorrect.", "error");
    }
  });

  logoutButton.addEventListener("click", function () {
    window.sessionStorage.removeItem(SESSION_KEY);
    resetForm();
    showLogin();
  });

  /* ---------------- Form state ---------------- */

  function resetForm() {
    taskForm.reset();
    taskIdInput.value = "";
    formHeading.textContent = "Add a task";
    submitButton.textContent = "Add task";
    cancelEditButton.hidden = true;
    clearMessage(formMessage);
    clearInvalidState();
  }

  function clearInvalidState() {
    [titleInput, courseInput, dueDateInput, descriptionInput].forEach(function (input) {
      input.removeAttribute("aria-invalid");
    });
  }

  // aria-invalid came from an accessibility example I found on MDN.
  function markInvalid(input) {
    input.setAttribute("aria-invalid", "true");
  }

  /* ---------------- Validation ---------------- */

  // Returns an array of error messages; an empty array means the form is valid.
  function validateTask(values) {
    var errors = [];
    clearInvalidState();

    if (values.title === "") {
      errors.push("Task title is required.");
      markInvalid(titleInput);
    }

    if (values.course === "") {
      errors.push("Course code or name is required.");
      markInvalid(courseInput);
    }

    if (values.description === "") {
      errors.push("Description is required.");
      markInvalid(descriptionInput);
    }

    if (values.dueDate === "") {
      errors.push("Due date is required.");
      markInvalid(dueDateInput);
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(values.dueDate)) {
      errors.push("Due date is not a valid date.");
      markInvalid(dueDateInput);
    } else {
      var parts = values.dueDate.split("-");
      var year = Number(parts[0]);
      var month = Number(parts[1]);
      var day = Number(parts[2]);
      var parsed = new Date(year, month - 1, day);

      // Asked the tutor why 31 February was accepted: Date rolls it into March.
      var isRealDate =
        parsed.getFullYear() === year &&
        parsed.getMonth() === month - 1 &&
        parsed.getDate() === day;

      if (!isRealDate) {
        errors.push("Due date is not a real calendar date.");
        markInvalid(dueDateInput);
      } else if (parsed.getTime() < startOfToday().getTime()) {
        errors.push("Due date cannot be earlier than today.");
        markInvalid(dueDateInput);
      }
    }

    return errors;
  }

  /* ---------------- Create and update ---------------- */

  taskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    var values = {
      title: titleInput.value.trim(),
      course: courseInput.value.trim(),
      dueDate: dueDateInput.value,
      description: descriptionInput.value.trim(),
      notes: notesInput.value.trim()
    };

    var errors = validateTask(values);

    if (errors.length > 0) {
      showMessage(formMessage, errors.join(" "), "error");
      return;
    }

    var tasks = loadTasks();
    var editingId = taskIdInput.value;

    if (editingId === "") {
      // New task: build an id from the current timestamp.
      tasks.push({
        id: String(Date.now()),
        title: values.title,
        course: values.course,
        dueDate: values.dueDate,
        description: values.description,
        notes: values.notes
      });
      saveTasks(tasks);
      resetForm();
      renderTasks();
      showMessage(formMessage, "Task added.", "success");
    } else {
      tasks = tasks.map(function (task) {
        if (task.id !== editingId) {
          return task;
        }
        return {
          id: task.id,
          title: values.title,
          course: values.course,
          dueDate: values.dueDate,
          description: values.description,
          notes: values.notes
        };
      });
      saveTasks(tasks);
      resetForm();
      renderTasks();
      showMessage(formMessage, "Task updated.", "success");
    }
  });

  cancelEditButton.addEventListener("click", function () {
    resetForm();
  });

  /* ---------------- Delete ---------------- */

  function deleteTask(id) {
    var confirmed = window.confirm("Delete this task? This cannot be undone.");

    if (!confirmed) {
      return;
    }

    var tasks = loadTasks().filter(function (task) {
      return task.id !== id;
    });

    saveTasks(tasks);
    renderTasks();
    showMessage(formMessage, "Task deleted.", "success");
  }

  /* ---------------- Render ---------------- */

  function statusFor(task) {
    var remaining = daysUntil(task.dueDate);

    if (remaining < 0) {
      return { label: "Overdue", className: "status-due" };
    }
    if (remaining <= 3) {
      return { label: "Due soon", className: "status-soon" };
    }
    return { label: "Upcoming", className: "status-ok" };
  }

  function renderTasks() {
    var tasks = loadTasks();

    // Earliest due date first.
    tasks.sort(function (a, b) {
      return a.dueDate.localeCompare(b.dueDate);
    });

    taskBody.innerHTML = "";

    if (tasks.length === 0) {
      taskTable.hidden = true;
      emptyState.hidden = false;
      taskCount.textContent = "No tasks yet.";
      return;
    }

    taskTable.hidden = false;
    emptyState.hidden = true;
    taskCount.textContent =
      tasks.length === 1 ? "1 task in total." : tasks.length + " tasks in total.";

    tasks.forEach(function (task) {
      var status = statusFor(task);
      var row = document.createElement("tr");

      row.innerHTML =
        "<td>" + escapeHtml(task.title) + "</td>" +
        "<td>" + escapeHtml(task.course) + "</td>" +
        "<td>" + formatDate(task.dueDate) + "</td>" +
        '<td><span class="status-pill ' + status.className + '">' + status.label + "</span></td>" +
        "<td>" + (task.notes === "" ? "&mdash;" : escapeHtml(task.notes)) + "</td>" +
        '<td><div class="row-actions">' +
        '<button type="button" class="button small" data-action="edit">Edit</button>' +
        '<button type="button" class="button small danger" data-action="delete">Delete</button>' +
        "</div></td>";

      // Using addEventListener keeps the handlers separate from the markup.
      row.querySelector('[data-action="edit"]').addEventListener("click", function () {
        startEdit(task.id);
      });

      row.querySelector('[data-action="delete"]').addEventListener("click", function () {
        deleteTask(task.id);
      });

      taskBody.appendChild(row);
    });
  }

  function startEdit(id) {
    var task = loadTasks().filter(function (item) {
      return item.id === id;
    })[0];

    if (!task) {
      return;
    }

    taskIdInput.value = task.id;
    titleInput.value = task.title;
    courseInput.value = task.course;
    dueDateInput.value = task.dueDate;
    descriptionInput.value = task.description;
    notesInput.value = task.notes;

    formHeading.textContent = "Edit task";
    submitButton.textContent = "Save changes";
    cancelEditButton.hidden = false;

    clearMessage(formMessage);
    // Smooth scroll taken from a Stack Overflow answer.
    window.scrollTo({ top: 0, behavior: "smooth" });
    titleInput.focus();
  }

  /* ---------------- Initial state ---------------- */

  var signedInUser = window.sessionStorage.getItem(SESSION_KEY);

  if (signedInUser) {
    showApp(signedInUser);
  } else {
    showLogin();
  }
})();
