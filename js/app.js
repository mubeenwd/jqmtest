function showMessage(msg) {
    navigator.notification.alert(
        msg,
        function () { },
        'Sarkar - Vidhansabha 2014',
        'Ok'
    );
}

function CheckDbStatus() {
    try {
        $(".ionic-body").waitMe({
            effect: 'ios',
            text: 'Please wait',
            bg: 'rgba(255,255,255,0.7)',
            color: '#000'
        });

        var db = window.sqlitePlugin.openDatabase({ name: "sarkar.db" });

        db.transaction(function (tx) {
            tx.executeSql('CREATE TABLE IF NOT EXISTS Voters (VoterId integer primary key, PartNo integer,Srlno integer,Mname text,Ename text,Fname text,RlnName text,LName text,IdCard text,Age text,HouseNo text,Gender text,PsName text,PsLocation text)');

            tx.executeSql("SELECT count(VoterId) as cnt FROM Voters;", [], function (tx, res) {
                if (res.rows.length > 0) {
                    if (res.rows.item(0).cnt > 1) {

                        $.mobile.changePage("#home", {
                            transition: "slide",
                            reverse: true,
                            changeHash: true
                        });

                        $('.ionic-body').waitMe('hide');
                    }
                    else {

                        $.mobile.changePage("#UpdateDb", {
                            transition: "slide",
                            reverse: true,
                            changeHash: true
                        });

                        $('.ionic-body').waitMe('hide');
                    }
                }
                else {
                    showMessage("Data not found");
                    $('.ionic-body').waitMe('hide');
                }
            }, function (error) {
                $('.ionic-body').waitMe('hide');
            });
        }, function (error) {
            $('.ionic-body').waitMe('hide');
        });
    } catch (e) {
        showMessage(e);
        $('.ionic-body').waitMe('hide');
    }
}

function StartUpdatingApp() {
    $("#progressBar").show();
    ReadLocaFiles(1);
}

function ReadLocaFiles(FileNo) {
    try {

        $.ajax({
            url: 'sarkar/' + FileNo + '.sql',
            type: 'get',
            contentType: "application/text; charset=utf-8",
            success: function (sql) {
                var db = window.sqlitePlugin.openDatabase({ name: "sarkar.db" });

                if (db) {
                    db.transaction(function (tx) {

                        try {
                            tx.executeSql(sql, [], function (tx, res) {
                                if (FileNo <= configurations.FileCount) {
                                    $("#meter").val(FileNo);
                                    $("#logger").html('<span style="padding:5px;color:008A00;">' + FileNo + ' of ' + configurations.FileCount + ' files(s) has been updated').fadeIn('slow');
                                    ReadLocaFiles(parseInt(FileNo) + 1);
                                }
                                else {

                                    showMessage("Application has been updated successfully!");

                                    $.mobile.changePage("#home", {
                                        transition: "slide",
                                        reverse: true,
                                        changeHash: true
                                    });
                                }
                            }, function (e) {
                                showMessage("tx.executeSql ERROR: " + JSON.stringify(e));
                            });
                        } catch (e) {
                            showMessage("db.executeSql catch block ERROR: " + JSON.stringify(e));
                        }
                    }, function (e) {
                        showMessage("db.transaction ERROR: " + JSON.stringify(e));
                    });
                }
                else {
                    showMessage("Db not created<br/>");
                }
            },
            error: function (xhr, ajaxOptions, thrownError) {
                showMessage("Ajax Error occured for " + FileNo + ", Error: " + JSON.stringify(xhr) + "<br/>");
            }
        });
    } catch (e) {
        showMessage("ReadLocaFiles Error " + JSON.stringify(e));
    }
}