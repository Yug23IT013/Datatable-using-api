$(document).ready(function () {

    const apiUrl = "https://glexas.com/hostel_data/API/test/new_admission_crud.php";
    let admissionTable;

    // Function to fetch data
    function fetchTableData() {
        return $.ajax({
            url: apiUrl,
            type: "GET",
            dataType: "json"
        });
    }

    // Function to initialize DataTable
    function initializeDataTable(data) {
        // Dynamically generate thead to match columns
        const firstRow = data.response[0];
        let theadHtml = '<tr>';
        Object.keys(firstRow).forEach(key => {
            if (key !== 'registration_main_id' && key !== 'created_time') {
                // Convert snake_case to Title Case for display
                theadHtml += `<th>${key.replace(/_/g, ' ').replace(/\\b\\w/g, l => l.toUpperCase())}</th>`;
            }
        });
        theadHtml += '<th>Actions</th></tr>';
        $('#admissionTable thead').html(theadHtml);

        admissionTable = $('#admissionTable').DataTable({
            data: data.response,
            dom: 'Bfrtip',
            buttons: [
                {
                    extend: 'excel',
                    text: 'Excel',
                    className: 'btn btn-success btn-sm me-2',
                    exportOptions: {
                        columns: [0, 1, 2, 3, 4, 5, 6]
                    },
                    title: 'Admission Data'
                },
                {
                    extend: 'csv',
                    text: 'CSV',
                    className: 'btn btn-info btn-sm me-2',
                    exportOptions: {
                        columns: [0, 1, 2, 3, 4, 5, 6]
                    },
                    title: 'Admission Data'
                },
                {
                    extend: 'pdf',
                    text: 'PDF',
                    className: 'btn btn-danger btn-sm me-2',
                    exportOptions: {
                        columns: [0, 1, 2, 3, 4, 5, 6]
                    },
                    title: 'Admission Data',
                },
                {
                    extend: 'print',
                    text: 'Print',
                    className: 'btn btn-secondary btn-sm',
                    exportOptions: {
                        columns: [0, 1, 2, 3, 4, 5, 6]
                    },
                    title: 'Admission Data'
                }
            ],
            columns: (() => {
                const columns = [];
                const firstRow = data.response[0];
                Object.keys(firstRow).forEach(key => {
                    if (key !== 'registration_main_id' && key !== 'created_time') {
                        columns.push({ data: key });
                    }
                });
                columns.push({
                    data: null,
                    render: function () {
                        return `
                            <i class="bi bi-pencil-square editBtn" aria-label="Edit User"></i>
                            <i class="bi bi-trash deleteBtn" aria-label="Delete User"></i>
                        `;
                    }
                });
                
                return columns;
            })(),
            language: {
                buttons: {
                    excel: 'Export to Excel',
                    csv: 'Export to CSV',
                    pdf: 'Export to PDF',
                    print: 'Print Table'
                }
            }
        });
    }

    // Show loading state
    Swal.fire({
        title: 'Loading Data',
        text: 'Please wait...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    // Fetch data and initialize table
    fetchTableData()
        .then(response => {
            Swal.close();
            initializeDataTable(response);
        })
        .catch(error => {
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: 'Failed to load data. Please try again later.'
            });
            console.error('Error fetching data:', error);
        });

    // Function to reload table data
    window.reloadTableData = function () {
        Swal.fire({
            title: 'Refreshing Data',
            text: 'Please wait...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        fetchTableData()
            .then(response => {
                Swal.close();
                admissionTable.clear();
                admissionTable.rows.add(response.response).draw();
            })
            .catch(error => {
                Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: 'Failed to refresh data. Please try again later.'
                });
                console.error('Error refreshing data:', error);
            });
    };

    // Open modal for Add User
    $('#addUserButton').click(function () {
        $('#admissionForm')[0].reset();
        $('#registrationMainId').val('');
        $('#admissionForm').validate().resetForm();
        $('#admissionForm .form-control').removeClass('is-invalid is-valid');
        $('#admissionModal').modal('show');
        $('#phoneValidationMsg').text('');
    });

    // Edit button click
    $('#admissionTable tbody').on('click', '.editBtn', function () {
        const rowData = admissionTable.row($(this).parents('tr')).data();
        const createdTime = new Date(rowData.created_time);
        const now = new Date();
        const diffMs = now - createdTime;
        const diffHours = diffMs / (1000 * 60 * 60);
        $('#phoneValidationMsg').text('');
        if (diffHours >= 24) {
            Swal.fire({
                icon: 'warning',
                title: 'Edit Disabled',
                text: 'You cannot edit record after 1 day.'
            });
            return;
        }

        $('#registrationMainId').val(rowData.registration_main_id);
        $('#userCode').val(rowData.user_code);
        $('#firstName').val(rowData.first_name);
        $('#middleName').val(rowData.middle_name);
        $('#lastName').val(rowData.last_name);
        $('#phoneInput').val(rowData.phone_number);
        $('#email').val(rowData.email);
        $('#admissionForm').validate().resetForm();
        $('#admissionForm .form-control').removeClass('is-invalid is-valid');
        $('#admissionModal').modal('show');
        iti.setNumber(rowData.phone_country_code + rowData.phone_number);
    });

    // Add this AFTER the iti initialization
    $.validator.addMethod("validPhone", function (value, element) {
        var input = element;
        var itiInstance = window.intlTelInputGlobals.getInstance(input);
        if (!itiInstance || !itiInstance.isValidNumber()) {
            return false;
        }
        // Remove non-digit characters and check length
        var digits = value.replace(/\D/g, '');
        return digits.length < 15;
    }, "Please enter a valid phone number");

    // jQuery Validation setup
    $('#admissionForm').validate({
        rules: {
            userCode: { required: true },
            firstName: { required: true },
            lastName: { required: true },
            phoneInput: {
                required: true,
                validPhone: true,
            },
            email: {
                required: true,
                email: true
            }
        },
        messages: {
            userCode: "Please enter the user code",
            firstName: "Please enter first name",
            lastName: "Please enter last name",
            email: {
                required: "Please enter email",
                email: "Enter a valid email"
            }
        },
        errorClass: 'is-invalid',
        validClass: '',
        errorElement: 'div',
        errorPlacement: function (error, element) {
            error.addClass('invalid-feedback');
            error.insertAfter(element);
        },
        highlight: function (element) {
            $(element).addClass('is-invalid').removeClass('is-valid');
        },
        unhighlight: function (element) {
            $(element).removeClass('is-invalid').addClass('is-valid');
        }
    });

    // Submit handler
    $('#admissionForm').submit(function (e) {
        e.preventDefault();

        if (!$('#admissionForm').valid()) {
            return;
        }

        if (!iti.isValidNumber()) {
            $('#phoneInput').addClass('is-invalid');
            return;
        }

        const isUpdate = $('#registrationMainId').val() !== "";

        const phoneNumber = iti.getNumber();
        const phoneCountryCode = '+' + iti.getSelectedCountryData().dialCode;

        const userData = {
            user_code: $('#userCode').val(),
            first_name: $('#firstName').val(),
            middle_name: $('#middleName').val(),
            last_name: $('#lastName').val(),
            phone_number: phoneNumber.replace(phoneCountryCode, ''),
            phone_country_code: phoneCountryCode,
            email: $('#email').val()
        };

        if (isUpdate) {
            userData.registration_main_id = $('#registrationMainId').val();
        }

        const method = isUpdate ? "PUT" : "POST";

        if (method === "POST") {
            $.ajax({
                url: apiUrl,
                type: method,
                data: $.param(userData),
                success: function () {
                    $('#admissionModal').modal('hide');
                    reloadTableData();
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'User has been added successfully',
                        timer: 2000,
                        showConfirmButton: false
                    });
                },
                error: function () {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: 'Failed to save user data'
                    });
                }
            });
        } else if (method === "PUT") {
            $.ajax({
                url: apiUrl,
                type: method,
                contentType: "application/json",
                data: JSON.stringify(userData),
                success: function () {
                    $('#admissionModal').modal('hide');
                    reloadTableData();
                    Swal.fire({
                        icon: 'success',
                        title: 'Success!',
                        text: 'User has been updated successfully',
                        timer: 2000,
                        showConfirmButton: false
                    });
                },
                error: function () {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: 'Failed to update user data'
                    });
                }
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: 'Invalid method'
            });
        }
    });

    // Delete button click
    $('#admissionTable tbody').on('click', '.deleteBtn', function () {
        const rowData = admissionTable.row($(this).parents('tr')).data();

        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#FF0000',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: apiUrl,
                    type: "DELETE",
                    contentType: "application/json",
                    data: JSON.stringify({ registration_main_id: rowData.registration_main_id }),
                    success: function () {
                        reloadTableData();
                        Swal.fire({
                            icon: 'success',
                            title: 'Deleted!',
                            text: 'User has been deleted successfully',
                            timer: 2000,
                            showConfirmButton: false
                        });
                    },
                    error: function () {
                        Swal.fire({
                            icon: 'error',
                            title: 'Error!',
                            text: 'Failed to delete user'
                        });
                    }
                });
            }
        });
    });

    const iti = window.intlTelInput(document.querySelector("#phoneInput"), {
        initialCountry: "auto",
        allowDropdown: true,
        strictMode: true,
        autoHideDialCode: false,
        utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@21.1.1/build/js/utils.js",
        geoIpLookup: function (callback) {
            fetch('https://ipinfo.io/json')
                .then(resp => resp.json())
                .then(resp => callback(resp.country))
                .catch(() => callback('us'));
        }
    });

    $('#phoneInput').on('input', function () {
        const input = document.querySelector("#phoneInput");
        const itiInstance = window.intlTelInputGlobals.getInstance(input);
        const value = input.value.replace(/\D/g, '');
        if (itiInstance && itiInstance.isValidNumber() && value.length >= 10) {
            $('#phoneValidationMsg').css('color', 'green');
        } else {
            $('#phoneValidationMsg').css('color', 'red');
        }
        $('#admissionForm').validate().element(this);
    });
});
