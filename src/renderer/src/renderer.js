import '../assets/main.css'
import { handleNavBar } from './handle-navbar.js'

const state = {
  page: 1,
  pageSize: 10,
  search: ''
}

let requestId = 0
let searchTimeout
let totalRecords = 0

const createMessageRow = (message) => {
  const row = document.createElement('tr')
  const cell = document.createElement('td')
  cell.colSpan = 4
  cell.className = 'border border-gray-300 px-4 py-6 text-center text-slate-500'
  cell.textContent = message
  row.append(cell)
  return row
}

const openModal = (elector) => {
  if (!elector) return

  for (const field of [
    'id',
    'nacionalidad',
    'cedula',
    'apellidos_nombres',
    'centro',
    'fecha_nacimiento'
  ]) {
    document.getElementById(`elector-modal-${field}`).value = elector[field] ?? ''
  }

  const modal = document.getElementById('modal')
  modal.classList.remove('hidden')
  modal.classList.add('flex')
}

const renderElectores = (rows, total) => {
  totalRecords = total
  const tableBody = document.getElementById('electores-table-body')
  tableBody.replaceChildren()

  if (rows.length === 0) {
    tableBody.append(
      createMessageRow(
        state.search ? 'No se encontraron electores.' : 'No hay electores registrados.'
      )
    )
  } else {
    for (const elector of rows) {
      const row = document.createElement('tr')
      row.className = 'hover:bg-slate-200'

      for (const value of [elector.id, elector.cedula, elector.apellidos_nombres]) {
        const cell = document.createElement('td')
        cell.className = 'border border-gray-300 px-4 py-1 text-center'
        cell.textContent = value == null ? '' : String(value)
        row.append(cell)
      }

      const actionsCell = document.createElement('td')
      actionsCell.className = 'w-14 border border-gray-300 px-2 py-1 text-center'

      const actionsButton = document.createElement('button')
      actionsButton.type = 'button'
      actionsButton.className =
        'open-modal inline-flex h-8 w-8 items-center justify-center rounded-md text-xl leading-none hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
      actionsButton.setAttribute('aria-label', `Acciones para elector ${elector.id}`)
      actionsButton.title = 'Abrir opciones'
      actionsButton.textContent = '⋮'
      actionsButton.addEventListener('click', () => openModal(elector))

      actionsCell.append(actionsButton)
      row.append(actionsCell)

      tableBody.append(row)
    }
  }

  tableBody.classList.remove('hidden')
  document.getElementById('elector-count').textContent = `Total de registros: ${total}`

  const pageCount = Math.ceil(total / state.pageSize)
  document.getElementById('page-indicator').textContent =
    `${total === 0 ? 0 : state.page} de ${pageCount}`
  document.getElementById('previous-page').disabled = state.page <= 1
  document.getElementById('next-page').disabled = state.page >= pageCount
}

const showLoadError = (error) => {
  console.error('No se pudieron cargar los electores:', error)
  const tableBody = document.getElementById('electores-table-body')
  tableBody.replaceChildren(
    createMessageRow(`No se pudieron cargar los electores: ${error.message}`)
  )
  tableBody.classList.remove('hidden')
  document.getElementById('elector-count').textContent = 'Error al cargar los registros'
  document.getElementById('page-indicator').textContent = '—'
  document.getElementById('previous-page').disabled = true
  document.getElementById('next-page').disabled = true
}

const loadElectores = async () => {
  const currentRequestId = ++requestId

  try {
    const result = await window.electoresAPI.listar(state)
    if (currentRequestId !== requestId) return

    const pageCount = Math.ceil(result.total / state.pageSize)
    if (pageCount > 0 && state.page > pageCount) {
      state.page = pageCount
      return loadElectores()
    }

    renderElectores(result.rows, result.total)
  } catch (error) {
    if (currentRequestId === requestId) showLoadError(error)
  }
}

const main = () => {
  handleNavBar()

  const modal = document.getElementById('modal')
  const closeModal = () => {
    modal.classList.add('hidden')
    modal.classList.remove('flex')
  }

  document.querySelectorAll('.open-modal').forEach((button) => {
    button.addEventListener('click', openModal)
  })
  document.getElementById('closeModal').addEventListener('click', closeModal)
  document.getElementById('closeModalBtn').addEventListener('click', closeModal)

  document.getElementById('previous-page').addEventListener('click', () => {
    if (state.page > 1) {
      state.page -= 1
      loadElectores()
    }
  })

  document.getElementById('next-page').addEventListener('click', () => {
    state.page += 1
    loadElectores()
  })

  document.getElementById('page-size').addEventListener('change', (event) => {
    state.pageSize = Number(event.currentTarget.value)
    state.page = 1
    loadElectores()
  })

  document.getElementById('elector-search').addEventListener('input', (event) => {
    window.clearTimeout(searchTimeout)
    state.search = event.currentTarget.value
    state.page = 1
    searchTimeout = window.setTimeout(loadElectores, 250)
  })

  document.getElementById('go-to-page-form').addEventListener('submit', (event) => {
    event.preventDefault()
    const input = document.getElementById('go-to-page')
    const requestedPage = Number(input.value)
    const pageCount = Math.ceil(totalRecords / state.pageSize)

    if (Number.isSafeInteger(requestedPage) && requestedPage > 0) {
      state.page = Math.min(requestedPage, Math.max(pageCount, 1))
      input.value = ''
      loadElectores()
    }
  })

  loadElectores()
}

document.addEventListener('DOMContentLoaded', main)
