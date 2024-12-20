document.addEventListener('DOMContentLoaded', () => {
  let currentDate = new Date();
  const calendar = document.querySelector('.calendar-grid');
  
  const TaskPriority = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
  };
  
  let tasks = [];
  
  function Task(title, date, priority, notes = '') {
    return {
      id: Date.now() + Math.random(),
      title,
      date,
      priority,
      notes,
      completed: false,
      created: new Date().toISOString()
    };
  }

  function addTask(title, date, priority = TaskPriority.MEDIUM, notes = '') {
    const task = new Task(title, date, priority, notes);
    tasks.push(task);
    saveTasks();
    return task;
  }

  function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasks();
  }

  function toggleTaskComplete(taskId) {
    const task = tasks.find(task => task.id === taskId);
    if (task) {
      task.completed = !task.completed;
      saveTasks();
    }
  }

  function saveTasks() {
    localStorage.setItem('proplan-tasks', JSON.stringify(tasks));
  }
  
  function loadTasks() {
    const savedTasks = localStorage.getItem('proplan-tasks');
    if (savedTasks) {
      tasks = JSON.parse(savedTasks);
    }
  }
  
  function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    document.getElementById('currentMonth').textContent = 
      firstDay.toLocaleDateString('default', { month: 'long', year: 'numeric' });
    
    calendar.innerHTML = '';
    
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
      calendar.innerHTML += `<div class="weekday">${day}</div>`;
    });
    
    for (let i = 0; i < firstDay.getDay(); i++) {
      calendar.innerHTML += `<div></div>`;
    }
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dateString = `${year}-${month + 1}-${day}`;
      const hasEvents = tasks.some(task => task.date === dateString);
      
      calendar.innerHTML += `
        <div class="calendar-day ${hasEvents ? 'has-events' : ''}" data-date="${dateString}">
          ${day}
        </div>
      `;
    }
    
    document.querySelectorAll('.calendar-day').forEach(dayElement => {
      dayElement.addEventListener('click', () => {
        const date = dayElement.dataset.date;
        showTasksForDate(date);
      });
    });
  }

  function showTasksForDate(date) {
    const dayTasks = tasks.filter(task => task.date === date);
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 15px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      z-index: 1000;
      max-width: 90%;
      width: 350px;
    `;
    
    modal.innerHTML = `
      <h3 style="margin-top:0">Tasks for ${new Date(date).toLocaleDateString()}</h3>
      ${dayTasks.length === 0 ? '<p>No tasks for this day</p>' : ''}
      <div id="taskList">
        ${dayTasks.map(task => `
          <div class="task-item" style="margin:10px 0; padding:10px; background:var(--light-purple); border-radius:8px;" data-task-id="${task.id}">
            <input type="checkbox" ${task.completed ? 'checked' : ''} data-task-id="${task.id}">
            <span style="color:var(--dark-purple)">${task.title}</span>
            <span style="float:right; color:var(--secondary-purple)">${task.priority}</span>
          </div>
        `).join('')}
      </div>
      <button id="addTaskBtn" style="
        background: var(--dark-purple);
        color: white;
        border: none;
        padding: 8px 15px;
        border-radius: 5px;
        margin-top: 10px;
        cursor: pointer;
      ">Add Task</button>
      <button id="closeModalBtn" style="
        background: var(--light-purple);
        border: none;
        padding: 8px 15px;
        border-radius: 5px;
        margin-top: 10px;
        margin-left: 10px;
        cursor: pointer;
      ">Close</button>
    `;

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 999;
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(modal);

    modal.querySelector('#closeModalBtn').addEventListener('click', () => {
      document.body.removeChild(modal);
      document.body.removeChild(overlay);
    });

    modal.querySelector('#addTaskBtn').addEventListener('click', () => {
      const title = prompt('Enter task title:');
      if (title) {
        const priority = prompt('Enter priority (low/medium/high):', 'medium');
        addTask(title, date, priority);
        document.body.removeChild(modal);
        document.body.removeChild(overlay);
        renderCalendar();
      }
    });

    modal.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        toggleTaskComplete(e.target.dataset.taskId);
        renderCalendar();
      });
    });
    
    initializeDragAndDrop();
  }
  
  function initializeDragAndDrop() {
    const taskItems = document.querySelectorAll('.task-item');
    taskItems.forEach(task => {
      task.setAttribute('draggable', true);
      
      task.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', task.dataset.taskId);
        task.classList.add('dragging');
      });
      
      task.addEventListener('dragend', () => {
        task.classList.remove('dragging');
      });
    });
    
    document.querySelectorAll('.calendar-day').forEach(day => {
      day.addEventListener('dragover', (e) => {
        e.preventDefault();
        day.classList.add('drag-over');
      });
      
      day.addEventListener('dragleave', () => {
        day.classList.remove('drag-over');
      });
      
      day.addEventListener('drop', (e) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('text/plain');
        const newDate = day.dataset.date;
        updateTaskDate(taskId, newDate);
        renderCalendar();
        day.classList.remove('drag-over');
      });
    });
  }
  
  function updateTaskDate(taskId, newDate) {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      task.date = newDate;
      saveTasks();
    }
  }
  
  document.getElementById('calendarCard').addEventListener('click', () => {
    alert('Smart Calendar: AI-powered scheduling helps you optimize your day');
  });
  
  document.getElementById('todoCard').addEventListener('click', () => {
    const today = new Date().toISOString().split('T')[0];
    showTasksForDate(today);
  });
  
  document.getElementById('habitCard').addEventListener('click', () => {
    alert('Habit Analytics: Track your daily habits and view detailed progress reports');
  });
  
  document.getElementById('statsCard').addEventListener('click', () => {
    const stats = getProductivityStats();
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 15px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      z-index: 1000;
      width: 300px;
    `;
    
    modal.innerHTML = `
      <h3>Productivity Stats</h3>
      <div class="stats-highlight">
        <h4>Completion Rate</h4>
        <p style="font-size: 24px; color: var(--dark-purple)">${stats.completionRate}%</p>
      </div>
      <p>Total Tasks: ${stats.total}</p>
      <p>Completed: ${stats.completed}</p>
      <p>Pending: ${stats.pending}</p>
      <p>High Priority: ${stats.highPriority}</p>
      <button id="closeStatsBtn" style="
        background: var(--dark-purple);
        color: white;
        border: none;
        padding: 8px 15px;
        border-radius: 5px;
        margin-top: 10px;
        cursor: pointer;
      ">Close</button>
    `;

    document.body.appendChild(modal);
    
    modal.querySelector('#closeStatsBtn').addEventListener('click', () => {
      document.body.removeChild(modal);
    });
  });

  function getProductivityStats() {
    const stats = {
      total: tasks.length,
      completed: tasks.filter(t => t.completed).length,
      pending: tasks.filter(t => !t.completed).length,
      highPriority: tasks.filter(t => t.priority === TaskPriority.HIGH).length
    };
    
    stats.completionRate = stats.total ? 
      Math.round((stats.completed / stats.total) * 100) : 0;
      
    return stats;
  }
  
  document.getElementById('prevMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
  });
  
  document.getElementById('nextMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
  });
  
  function addTooltip(element, text) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = text;
    
    element.addEventListener('mouseenter', () => {
      document.body.appendChild(tooltip);
      const rect = element.getBoundingClientRect();
      tooltip.style.top = `${rect.bottom + 5}px`;
      tooltip.style.left = `${rect.left + (rect.width/2) - (tooltip.offsetWidth/2)}px`;
    });
    
    element.addEventListener('mouseleave', () => {
      document.body.removeChild(tooltip);
    });
  }

  addTooltip(document.getElementById('calendarCard'), 'AI-powered smart scheduling');
  addTooltip(document.getElementById('todoCard'), 'Manage your tasks efficiently');
  addTooltip(document.getElementById('habitCard'), 'Track and analyze your habits');
  addTooltip(document.getElementById('statsCard'), 'View your productivity insights');
  
  loadTasks();
  renderCalendar();
});
