from flask.cli import FlaskGroup

from freeloadr import app, db, socketio


cli = FlaskGroup(app)

@cli.command('drop_db')
def drop_db():
    db.drop_all()

@cli.command("create_db")
def create_db():
    # db.drop_all()
    db.create_all()
    db.session.commit()

@cli.command("run_socket")
def run_socket():
    print('wasbappin')
    socketio.run(app, host='0.0.0.0')


if __name__ == "__main__":
    cli()