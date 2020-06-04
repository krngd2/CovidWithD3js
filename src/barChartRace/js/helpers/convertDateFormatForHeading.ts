
export function convertDateFormatForHeading(inputDate){
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
    let date=new Date(inputDate);
    return date.getDate()+'-'+monthNames[date.getMonth()]+'-'+date.getFullYear();
}
