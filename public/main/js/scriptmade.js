// country code

 var phone_number = window.intlTelInput(document.querySelector("#phone"), {
  separateDialCode: true,
  preferredCountries:["in"],
  hiddenInput: "full",
  utilsScript: "//cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.3/js/utils.js"
});

$("form").submit(function() {
  var full_number = phone_number.getNumber(intlTelInputUtils.numberFormat.E164);
$("input[name='phone_number[full]'").val(full_number);
});
 
//profile crop

// Get the modal
var modal = document.getElementById("myModalA");

// Get the button that opens the modal
var btn = document.getElementById("file1");

// Get the <span> element that closes the modal
var span = document.getElementById("close");
var span2 = document.getElementById("crop-btn")


// When the user clicks the button, open the modal 
btn.onclick = function() {
  modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
  modal.style.display = "none";
}
span2.onclick = function() {
  modal.style.display = "none";
}
// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}


    function fileValidation1() {
        const imagebox = document.getElementById('image-box')
        const crop_btn = document.getElementById('crop-btn')
        var fileInput = document.getElementById('file1');
        

        var filePath = fileInput.value;
        var allowedExtensions = /(\.jpg|\.jpeg|\.png|\.gif)$/i;
        if (!allowedExtensions.exec(filePath)) {
            alert('Please upload file having extensions .jpeg only.');
            fileInput.value = '';
            return false;
        } else {
            //Image preview
            const img_data = fileInput.files[0]
            const url = URL.createObjectURL(img_data)

            imagebox.innerHTML = `<img src="${url}" id="image" style="width:100%">`

            const image = document.getElementById('image')

            document.getElementById('image-box').style.display = 'block'
            document.getElementById('crop-btn').style.display = 'block'

           
            const cropper = new Cropper(image, {
                autoCropArea: 1,
                viewMode: 1,
                scalable: false,
                zoomable: false,
                movable: false,
                aspectRatio: 16 / 19,
              //  preview: '.preview',
                minCropBoxWidth: 180,
                minCropBoxHeight: 240,
            })

            crop_btn.addEventListener('click', () => {
                cropper.getCroppedCanvas().toBlob((blob) => {

                    let fileInputElement = document.getElementById('file1');
                    let file = new File([blob], img_data.name, { type: "image/*", lastModified: new Date().getTime() });
                    let container = new DataTransfer();
                   
                    container.items.add(file);
                     const img = container.files[0]
                     var url =URL.createObjectURL(img)                    
                     fileInputElement.files = container.files;
                     document.getElementById('imgview1').src=url
                     document.getElementById('imgview').src=url

                    document.getElementById('image-box').style.display = 'none'
                    document.getElementById('crop-btn').style.display = 'none'

                });
            });
        }
    }

//validation emp-edit-profile

$(document).ready(()=>{
    
 
  $("#edit-profile").validate({ 
    a:()=>{
      console.log('err')
    },      
      rules: {
        companyname: {
          required: true,
          minlength: 4,
        },
        email: {
          required: true,
          email: true,
        },
        mobile:{
          required:true,
          minlength:10,
          maxlength:11
        },
        discription:{
          required:true,
          minlength:30,
        },
        field:{
          required:true,
        },
        launch_date: {
          required: true,
        },
        skills: {
          required: true,
        },
        language:{
          required:true,
        },
        location:{
          required:true,
        }   
      }
    })
     })

  // bookmark

  function test(jobId){ 
    $.ajax({ url:'/SaveJob', data:{ Id : jobId }, method:'post',
    success:(response)=>{
      if(response.status){
       $( ".flash" ).addClass( "animate--drop-in-fade-out" );
    setTimeout(function(){
      $( ".flash" ).removeClass( "animate--drop-in-fade-out" );
    }, 3500);}
     } }) }

   function saveCompany(companyId){ 
    $.ajax({ url:'/SaveCompany', data:{ Id : companyId }, method:'post',
    success:(response)=>{ 
      if(response.status){
       $( ".flash" ).addClass( "animate--drop-in-fade-out" );
    setTimeout(function(){
      $( ".flash" ).removeClass( "animate--drop-in-fade-out" );
    }, 3500);}
     } }) }