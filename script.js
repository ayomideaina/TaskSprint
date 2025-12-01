const toggleBtn = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");
const body = document.body;

const addBtn = document.getElementById("add-task-btn");
const addModal = document.getElementById("addModal");
const saveAddBtn = document.getElementById("saveAddModal");

const titleInput = document.getElementById("add-title");
const descInput = document.getElementById("add-description");
const dueInput = document.getElementById("add-due");
const errorMsg = document.getElementById("add-error");

const editModal = document.getElementById("editModal");
const editTitle = document.getElementById("edit-title");
const editDesc = document.getElementById("edit-description");
const editDue = document.getElementById("edit-due");
const saveEditBtn = document.getElementById("saveEditModal");
const closeEditModal = document.getElementById("closeEditModal");

const deleteModal = document.getElementById("deleteModal");
const confirmDeleteBtn = document.getElementById("confirm-delete");
const cancelDeleteBtn = document.getElementById("cancel-delete");

let currentEditId = null;
let currentDeleteId = null;


const API_URL = "https://todo-endpoint.onrender.com/todos";

// const API_URL = "http://localhost:3000/todos";


// theme
if (localStorage.getItem("theme") === "light") {
  body.classList.add("light-mode");
  themeIcon.className = "fas fa-moon";
}

toggleBtn.addEventListener("click", () => {
  body.classList.toggle("light-mode");

  const isLight = body.classList.contains("light-mode");
  themeIcon.className = isLight ? "fas fa-moon" : "fas fa-sun";

  localStorage.setItem("theme", isLight ? "light" : "dark");
});


const toggleEmptyState = () => {
  const empty = document.getElementById("empty-state");
  const tasks = document.querySelectorAll(".task-item");

  empty.style.display = tasks.length === 0 ? "flex" : "none";
};


// READ/GET METHOD
const fetchTodos = async () => {
  try {
    const response = await fetch(API_URL);
    const todos = await response.json();
    renderTodos(todos);
  } catch (err) {
    console.error("Fetch failed:", err);
  }
};

// to open the add task modal
addBtn.addEventListener('click', () =>{
  addModal.classList.add('show');
});

addModal.addEventListener("click", (e) => {
  if (e.target === addModal) {
    addModal.classList.remove("show");
  }
});

// Clear error while typing
const clearErrorIfValid = () => {
  if (titleInput.value.trim() && dueInput.value.trim()) {
    errorMsg.textContent = "";
    errorMsg.classList.add("hide-error");
    errorMsg.classList.remove("error");
  }
};
titleInput.addEventListener("input", clearErrorIfValid);
dueInput.addEventListener("input", clearErrorIfValid);

// create tasks (POST)
const addTodo = async () => {
  const title = titleInput.value.trim();
  const due = dueInput.value.trim();

  if (!title || !due) {
    errorMsg.textContent = "Title and due date are required.";
    errorMsg.classList.remove("hide-error");
    errorMsg.classList.add("error");
    return;
  }

  const newTodo = {
    title,
    description: descInput.value.trim(),
    dueDate: due,
    completed: false
  };

  try {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTodo)
    });

    showNotification("Task added successfully");
    addModal.classList.remove("show");

    titleInput.value = "";
    descInput.value = "";
    dueInput.value = "";

    fetchTodos();
  } catch (err) {
    console.error("Add failed:", err);
  }
};

saveAddBtn.addEventListener("click", addTodo);


// RENDER TODOS/to display all tasks added in the task list
const renderTodos = (todos) => {
  const list = document.getElementById("task-list");
  list.innerHTML = "";

  const now = new Date();

  todos.forEach((todo) => {
    const li = document.createElement("li");

    li.className = "task-item";
    li.dataset.id = todo.id;
    li.dataset.completed = todo.completed;

    if (todo.completed) li.classList.add("completed");

    if (todo.dueDate && !todo.completed) {
      const dueDate = new Date(todo.dueDate);
      const daysLeft = (dueDate - now) / (1000 * 60 * 60 * 24);

      // Overdue
      if (daysLeft < 0) {
        li.classList.add("overdue");
        showNotification(`${todo.title} is OVERDUE!`, "error");
      }
      // Due soon 
      else if (daysLeft <= 2) {
        li.classList.add("due-soon");
        showNotification(`${todo.title} is due soon!`);
      }
    }

    li.innerHTML = `
      <div class="task-left">
        <button class="circle-btn" data-id="${todo.id}">
          <i class="fa-solid fa-check check-icon"></i>
        </button>

        <div class="task-info">
          <h3 class="task-title">${todo.title}</h3>
          ${todo.description ? `<p class="task-desc">${todo.description}</p>` : ""}
          ${todo.dueDate ? `<span class="task-date">Due: ${todo.dueDate}</span>` : ""}
        </div>
      </div>

      <div class="task-actions">
        <button class="edit-btn" data-id="${todo.id}"><i class="fa-solid fa-pen"></i></button>
        <button class="delete-btn" data-id="${todo.id}"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;

    list.appendChild(li);
  });

  handleCompleteToggle();
  toEditTask();
  toDeleteTask();
  toggleEmptyState();
};

// EDIT REQUEST
const toEditTask = () => {
  document.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      currentEditId = btn.dataset.id;

      const res = await fetch(`${API_URL}/${currentEditId}`);
      const todo = await res.json();

      editTitle.value = todo.title;
      editDesc.value = todo.description;
      editDue.value = todo.dueDate;

      editModal.classList.add("show");
    });
  });
};

saveEditBtn.addEventListener("click", async () => {
  await fetch(`${API_URL}/${currentEditId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: editTitle.value.trim(),
      description: editDesc.value.trim(),
      dueDate: editDue.value
    })
  });

  editModal.classList.remove("show");
  showNotification("Task updated");
  fetchTodos();
});

closeEditModal.addEventListener("click", () => editModal.classList.remove("show"));


// DELETE To-do
const toDeleteTask = () => {
  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentDeleteId = btn.dataset.id;
      deleteModal.classList.add("show");
    });
  });
};

cancelDeleteBtn.addEventListener("click", () => deleteModal.classList.remove("show"));

confirmDeleteBtn.addEventListener("click", async () => {
  await fetch(`${API_URL}/${currentDeleteId}`, { method: "DELETE" });

  deleteModal.classList.remove("show");
  showNotification("Task deleted");
  fetchTodos();
});

//Tick to-do as completed
const handleCompleteToggle = () => {
  document.querySelectorAll(".circle-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const li = btn.closest("li");

      const newStatus = !(li.dataset.completed === "true");

      await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: newStatus })
      });

      fetchTodos();
    });
  });
};

// Filter tasks
document.querySelector(".filters").addEventListener("click", (e) => {
  if (!e.target.classList.contains("filter-btn")) return;

  document.querySelectorAll(".filter-btn").forEach((btn) => btn.classList.remove("active"));
  e.target.classList.add("active");

  const filter = e.target.textContent.trim();
  const items = document.querySelectorAll(".task-item");

  items.forEach((item) => {
    const done = item.dataset.completed === "true";

    item.style.display =
      filter === "All" ? "flex" :
      filter === "Active" && !done ? "flex" :
      filter === "Completed" && done ? "flex" : "none";
  });
});


// CLEAR COMPLETED
document.getElementById("clear-completed").addEventListener("click", async () => {
  const completed = document.querySelectorAll(".task-item.completed");

  for (const li of completed) {
    await fetch(`${API_URL}/${li.dataset.id}`, { method: "DELETE" });
  }

  fetchTodos();
});


const showNotification = (message, type = "success") => {
  const container = document.getElementById("notification-container");

  const box = document.createElement("div");
  box.className = `notification ${type}`;
  box.textContent = message;

  container.appendChild(box);

  setTimeout(() => box.remove(), 3000);
};

window.addEventListener("DOMContentLoaded", fetchTodos);
