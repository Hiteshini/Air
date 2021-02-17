const { end } = require('../config/db');
const pool = require('../config/db');

class Report{
    /* Total revenue generated by each Aircraft type */
    static async revenueFromEachModel(){
        const query = `
            SELECT SUM(price) as total_revenue,model_name,variant
            FROM Passenger_Seat RIGHT JOIN Aircraft_Model USING(model_id)
            GROUP BY model_name,variant;
        `;
        const result = await pool.query(query);
        return result.rows;
    }

    /* Given a date range, number of passengers travelling to a given destination */
    static async getNumberOfPassengersTravellingToGivenDest(startDate,endDate,destinationAirport){
        const query = `
            SELECT COUNT(*) FROM Passenger_Seat WHERE
            booking_id IN
                (
                    SELECT booking_id FROM Seat_Booking WHERE 
                    schedule_id IN
                    (
                        SELECT schedule_id FROM Flight_Schedule
                        WHERE route_id IN
                        (SELECT route_id FROM Route WHERE destination=$1)
                        AND departure_date >= $2 AND departure_date <=$3
                    )
                )
        `;
        const result = await pool.query(query,[destinationAirport,startDate,endDate]);
        return result.rows[0];
    }

    /*Given a flight no, all passengers travelling in it (next immediate flight) below age 18, above age 18*/
    static async getPassengerDetailsOnNextFlightOnGivenRoute(routeId){
        const query =`
            SELECT name,passport_no,get_age(dob) FROM Passenger_Seat
            WHERE booking_id IN
            (
                SELECT booking_id FROM Seat_Booking WHERE
                schedule_id =
                (
                    SELECT schedule_id FROM Flight_Schedule
                    WHERE route_id=$1 AND flight_state=$2
                    ORDER BY departure_date ASC
                    LIMIT 1
                )
            )
        `;
        const result = await pool.query(query,[routeId,'Scheduled']);
        return result.rows;

    }

    /* Given a date range, number of bookings by each passenger type */
    static async numberOfBookingsByEachPassengerType(startDate,endDate){
     const query =`
        SELECT count(booking_id),Customer.type FROM Seat_Booking
        INNNER JOIN Customer USING(customer_id)
        WHERE 
        Seat_Booking.booking_id IN
        (
            SELECT booking_id FROM Seat_Booking WHERE
            date_of_booking>=$1 AND date_of_booking<=$1
        )
        GROUP BY Customer.type
     `;
     const result = await pool.query(query,[startDate,endDate]);
        return result.rows;
    }



}
module.exports = Report;